import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  WASocket,
  makeCacheableSignalKeyStore,
  proto,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import { storage } from "../storage";
import path from "path";
import fs from "fs";

const SESSIONS_DIR = path.join(process.cwd(), ".sessions");
const logger = pino({ level: "silent" });

export type SessionStatus =
  | "starting"
  | "waiting_qr"
  | "connected"
  | "disconnected"
  | "error";

export interface SessionState {
  sessionId: string;
  status: SessionStatus;
  qrCodeBase64?: string;
  phoneNumber?: string;
  connectionId?: string;
  error?: string;
  socket?: WASocket;
}

class BaileyService {
  private sessions = new Map<string, SessionState>();
  // Map connectionId -> active socket for sending messages
  private activeSockets = new Map<string, WASocket>();

  constructor() {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    console.log("🐝 BaileyService inicializado");
  }

  /** Called once at startup — reconnects all accounts that were connected before restart */
  async restoreConnectedSessions(): Promise<void> {
    try {
      const connections = await storage.getAllWhatsappConnections("default-user");
      const connected = connections.filter((c) => c.isConnected);
      if (connected.length === 0) return;
      console.log(`🔄 Reconectando ${connected.length} conta(s) WhatsApp salva(s)...`);
      for (const conn of connected) {
        const authDir = this.sessionDir(conn.id);
        if (fs.existsSync(authDir) && fs.readdirSync(authDir).length > 0) {
          console.log(`♻️  Restaurando sessão para ${conn.phoneNumber} (${conn.id})`);
          // Use the connectionId as the sessionId so activeSockets maps correctly
          this.startSession(conn.id, conn.userId).catch((err) =>
            console.error(`Erro ao restaurar sessão ${conn.id}:`, err)
          );
        } else {
          // No saved auth state — mark as disconnected in DB
          await storage.updateWhatsappConnection(conn.id, { isConnected: false });
          console.log(`⚠️  Sem credenciais salvas para ${conn.phoneNumber}, marcado como desconectado`);
        }
      }
    } catch (err) {
      console.error("Erro ao restaurar sessões:", err);
    }
  }

  private sessionDir(sessionId: string) {
    return path.join(SESSIONS_DIR, sessionId);
  }

  async startSession(sessionId: string, userId: string): Promise<void> {
    if (this.sessions.has(sessionId)) return;

    this.sessions.set(sessionId, { sessionId, status: "starting" });

    try {
      const authDir = this.sessionDir(sessionId);
      fs.mkdirSync(authDir, { recursive: true });

      // Fetch the latest WA version — required to avoid "Connection Failure"
      const { version, isLatest } = await fetchLatestBaileysVersion();
      console.log(`📡 Usando WA versão ${version.join(".")} (latest: ${isLatest})`);

      const { state, saveCreds } = await useMultiFileAuthState(authDir);

      const sock = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger as any),
        },
        logger: logger as any,
        printQRInTerminal: false,
        browser: ["PilotZap", "Chrome", "126.0.0"],
        connectTimeoutMs: 60_000,
        defaultQueryTimeoutMs: 20_000,
        keepAliveIntervalMs: 25_000,
        retryRequestDelayMs: 500,
        generateHighQualityLinkPreview: false,
        getMessage: async (key): Promise<proto.IMessage | undefined> => {
          return { conversation: "" };
        },
      });

      const session = this.sessions.get(sessionId)!;
      session.socket = sock;

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const base64 = await QRCode.toDataURL(qr, {
              errorCorrectionLevel: "M",
              margin: 2,
              width: 300,
            });
            const current = this.sessions.get(sessionId);
            if (current) {
              current.status = "waiting_qr";
              current.qrCodeBase64 = base64;
            }
            console.log(`📱 QR Code gerado para sessão ${sessionId}`);
          } catch (err) {
            console.error("Erro ao gerar QR Code base64:", err);
          }
        }

        if (connection === "open") {
          const rawId = sock.user?.id ?? "";
          const phone = rawId.split(":")[0].split("@")[0];
          const current = this.sessions.get(sessionId);
          if (current) {
            current.status = "connected";
            current.phoneNumber = phone;
          }
          console.log(`✅ WhatsApp conectado! Número: ${phone}`);

          try {
            // Check if this sessionId is already a DB connection ID (restore flow)
            const existingConns = await storage.getAllWhatsappConnections(userId);
            const isRestore = existingConns.some((c) => c.id === sessionId);

            let connectionId: string;
            if (isRestore) {
              // Just update the existing record
              await storage.updateWhatsappConnection(sessionId, {
                isConnected: true,
                phoneNumber: phone,
                lastConnectedAt: new Date(),
              });
              connectionId = sessionId;
              console.log(`♻️  Sessão restaurada para ${phone}`);
            } else {
              // New connection — create DB record then rename auth folder
              const conn = await storage.createWhatsappConnection({
                userId,
                phoneNumber: phone,
                name: `WhatsApp ${phone}`,
                isConnected: true,
                lastConnectedAt: new Date(),
              });
              connectionId = conn.id;

              // Rename .sessions/{sessionId}/ → .sessions/{connectionId}/
              // so future restarts can find the auth files using the DB ID
              const oldDir = this.sessionDir(sessionId);
              const newDir = this.sessionDir(connectionId);
              if (fs.existsSync(oldDir) && oldDir !== newDir) {
                try {
                  fs.renameSync(oldDir, newDir);
                } catch (renameErr) {
                  console.error("Erro ao mover pasta de sessão:", renameErr);
                }
              }
            }

            const cur = this.sessions.get(sessionId);
            if (cur) {
              cur.connectionId = connectionId;
              this.activeSockets.set(connectionId, sock);
            }
          } catch (err) {
            console.error("Erro ao salvar conexão no DB:", err);
          }
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const loggedOut = statusCode === DisconnectReason.loggedOut;
          const current = this.sessions.get(sessionId);

          console.log(
            `⚠️ Conexão fechada (sessão ${sessionId}) statusCode=${statusCode} loggedOut=${loggedOut}`
          );

          if (current) {
            // Remove socket from activeSockets since it's closed
            if (current.connectionId) {
              this.activeSockets.delete(current.connectionId);
              // Mark DB as disconnected
              storage.updateWhatsappConnection(current.connectionId, { isConnected: false }).catch(() => {});
            }

            if (loggedOut) {
              current.status = "error";
              current.error = "Desconectado pelo celular";
            } else if (
              statusCode === 515 ||
              statusCode === 428 ||
              statusCode === undefined
            ) {
              // Transient failure — retry regardless of previous status
              console.log(`🔄 Tentando reconectar sessão ${sessionId}...`);
              current.status = "starting";
              current.qrCodeBase64 = undefined;
              current.error = undefined;
              current.socket = undefined;
              setTimeout(async () => {
                this.sessions.delete(sessionId);
                await this.startSession(sessionId, userId);
              }, 3_000);
            } else {
              current.status = "disconnected";
              current.error = `Código: ${statusCode}`;
            }
          }
        }
      });

      sock.ev.on("creds.update", saveCreds);

      // 📨 Listener de mensagens recebidas — dispara os funis
      sock.ev.on("messages.upsert", async ({ messages: msgs, type }) => {
        console.log(`📬 messages.upsert disparado — tipo: ${type}, total msgs: ${msgs.length}`);

        // Accept both "notify" (real-time) and "append" (post-reconnect delivery)
        if (type !== "notify" && type !== "append") return;

        for (const msg of msgs) {
          const jid = msg.key.remoteJid ?? "";
          const fromMe = msg.key.fromMe ?? false;
          console.log(`  msg JID=${jid} fromMe=${fromMe} type=${type}`);

          if (fromMe) continue;
          if (!jid || jid.endsWith("@g.us") || jid.endsWith("@broadcast")) continue;

          const phone = jid.replace("@s.whatsapp.net", "").replace(/\D/g, "");
          const text = (
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption ||
            ""
          ).trim();

          console.log(`📨 Mensagem recebida de ${phone}: "${text}"`);
          await this.handleIncomingMessage(userId, phone, text);
        }
      });
    } catch (err: any) {
      const current = this.sessions.get(sessionId);
      if (current) {
        current.status = "error";
        current.error = err.message;
      }
      console.error(`❌ Erro ao iniciar sessão ${sessionId}:`, err);
    }
  }

  getSession(sessionId: string): SessionState | undefined {
    return this.sessions.get(sessionId);
  }

  async terminateSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session?.socket) {
      try { session.socket.end(undefined); } catch (_) {}
    }
    const connectionId = session?.connectionId;
    if (connectionId) {
      this.activeSockets.delete(connectionId);
    }
    this.sessions.delete(sessionId);

    // Remove auth files — check both the original sessionId folder AND the renamed connectionId folder
    for (const dirId of [sessionId, connectionId].filter(Boolean) as string[]) {
      try {
        const dir = this.sessionDir(dirId);
        if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
      } catch (_) {}
    }
  }

  private async handleIncomingMessage(userId: string, phone: string, text: string): Promise<void> {
    try {
      // Find or create contact
      let contact = await storage.getContactByPhone(phone, userId);
      if (!contact) {
        contact = await storage.createContact({
          userId,
          phoneNumber: phone,
          name: phone,
          isActive: true,
        });
        console.log(`👤 Novo contato criado: ${phone}`);
      }

      // Load active funnels and find matching ones
      const allFunnels = await storage.getAllFunnels(userId);
      const activeFunnels = allFunnels.filter((f) => f.status === "active");

      for (const funnel of activeFunnels) {
        const phrases = (funnel.triggerPhrases as string[] | null) ?? [];

        // Empty phrases = catch-all; otherwise check if text contains any phrase
        const matches =
          phrases.length === 0 ||
          phrases.some((p) => text.toLowerCase().includes(p.toLowerCase()));

        if (matches) {
          console.log(`🔀 Funil "${funnel.name}" disparado para ${phone}`);
          // Dynamic import avoids circular dependency
          const { funnelService } = await import("./funnelService");
          await funnelService.executeFunnel(funnel.id, contact!.id, text);
          break; // Only first matching funnel runs
        }
      }
    } catch (err) {
      console.error("Erro ao processar mensagem recebida:", err);
    }
  }

  async sendMessage(
    connectionId: string,
    to: string,
    text: string
  ): Promise<boolean> {
    const sock = this.activeSockets.get(connectionId);
    if (!sock) {
      console.error(`❌ Nenhuma socket ativa para connectionId ${connectionId}`);
      return false;
    }
    try {
      const jid = to.includes("@")
        ? to
        : `${to.replace(/\D/g, "")}@s.whatsapp.net`;
      await sock.sendMessage(jid, { text });
      return true;
    } catch (err) {
      console.error("Erro ao enviar mensagem via Baileys:", err);
      return false;
    }
  }

  isConnectionActive(connectionId: string): boolean {
    return this.activeSockets.has(connectionId);
  }

  getConnectedCount(userId: string): number {
    let count = 0;
    for (const [, session] of this.sessions) {
      if (session.status === "connected") count++;
    }
    return count;
  }
}

export const baileyService = new BaileyService();
