import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  WASocket,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import { storage } from "../storage";
import path from "path";
import fs from "fs";

const SESSIONS_DIR = path.join(process.cwd(), ".sessions");

export type SessionStatus =
  | "starting"
  | "waiting_qr"
  | "qr_updated"
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

  constructor() {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    console.log("🐝 BaileyService inicializado");
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

      const { state, saveCreds } = await useMultiFileAuthState(authDir);

      const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }) as any,
        printQRInTerminal: false,
        browser: Browsers.appropriate("Desktop"),
        connectTimeoutMs: 60000,
      });

      const session = this.sessions.get(sessionId)!;
      session.socket = sock;

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const base64 = await QRCode.toDataURL(qr);
            const current = this.sessions.get(sessionId);
            if (current) {
              current.status = "waiting_qr";
              current.qrCodeBase64 = base64;
            }
            console.log(`📱 QR Code gerado para sessão ${sessionId}`);
          } catch (err) {
            console.error("Erro ao gerar QR Code:", err);
          }
        }

        if (connection === "open") {
          const phone = sock.user?.id?.split(":")[0]?.split("@")[0] || "";
          const current = this.sessions.get(sessionId);
          if (current) {
            current.status = "connected";
            current.phoneNumber = phone;
          }
          console.log(`✅ WhatsApp conectado! Número: ${phone}`);

          try {
            const conn = await storage.createWhatsappConnection({
              userId,
              phoneNumber: phone,
              name: `WhatsApp ${phone}`,
              isConnected: true,
              lastConnectedAt: new Date(),
            });
            const cur = this.sessions.get(sessionId);
            if (cur) cur.connectionId = conn.id;
          } catch (err) {
            console.error("Erro ao salvar conexão no DB:", err);
          }
        }

        if (connection === "close") {
          const code = (lastDisconnect?.error as any)?.output?.statusCode;
          const loggedOut = code === DisconnectReason.loggedOut;
          const current = this.sessions.get(sessionId);
          if (current && current.status !== "connected") {
            current.status = loggedOut ? "error" : "disconnected";
            current.error = loggedOut
              ? "Desconectado pelo celular"
              : "Conexão perdida";
          }
          console.log(`⚠️ Conexão fechada para sessão ${sessionId}: ${lastDisconnect?.error?.message}`);
        }
      });

      sock.ev.on("creds.update", saveCreds);
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
      try {
        await session.socket.logout();
      } catch (_) {}
    }
    this.sessions.delete(sessionId);
  }

  async sendMessage(connectionId: string, to: string, text: string): Promise<boolean> {
    for (const [, session] of this.sessions) {
      if (session.connectionId === connectionId && session.socket) {
        try {
          const jid = to.includes("@") ? to : `${to.replace(/\D/g, "")}@s.whatsapp.net`;
          await session.socket.sendMessage(jid, { text });
          return true;
        } catch (err) {
          console.error("Erro ao enviar mensagem via Baileys:", err);
          return false;
        }
      }
    }
    return false;
  }

  getConnectionStatus(connectionId: string): boolean {
    for (const [, session] of this.sessions) {
      if (session.connectionId === connectionId && session.status === "connected") {
        return true;
      }
    }
    return false;
  }
}

export const baileyService = new BaileyService();
