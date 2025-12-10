import makeWASocket, { 
  ConnectionState, 
  WASocket, 
  useMultiFileAuthState,
  DisconnectReason,
  proto,
  Browsers,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import { storage } from '../storage';
import { getPlanLimits, type PlanType } from '@shared/plan-limits';

interface WhatsAppConnection {
  connected: boolean;
  phoneNumber?: string;
  status: string;
}

export class WhatsAppService {
  private sock: WASocket | null = null;
  private qrCode: string = '';
  private qrImage: string = '';
  private pairingCode: string = '';
  private isReady: boolean = false;
  private currentUserId: string = '';
  private qrRefreshTimer: NodeJS.Timeout | null = null;
  private isGeneratingQR: boolean = false;
  private connectionStatus: WhatsAppConnection = {
    connected: false,
    status: 'disconnected'
  };

  constructor() {
    console.log('🚀 WhatsAppService inicializado com Baileys');
  }

  // 📱 INICIALIZAR SOCKET BAILEYS COM PAIRING CODE
  private async initializeSocket(phoneNumber?: string) {
    try {
      const { state, saveCreds } = await useMultiFileAuthState('./server/wa_auth');
      
      console.log('🔧 Estado de autenticação carregado, creds:', !!state.creds?.me);
      
      this.sock = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: false,
        generateHighQualityLinkPreview: true,
      });

      console.log('✅ Socket criado com sucesso');
      
      // Se tiver número de telefone, aguardar conexão e usar pairing code
      if (phoneNumber && !state.creds?.registered) {
        console.log('📱 Aguardando conexão para solicitar pairing code...');
        
        // Aguardar um pouco para a conexão estabilizar
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          console.log('📱 Solicitando pairing code para:', phoneNumber);
          const code = await this.sock.requestPairingCode(phoneNumber);
          this.pairingCode = code;
          console.log('✅ Pairing code gerado:', code);
        } catch (err) {
          console.error('❌ Erro ao gerar pairing code:', err);
          throw err;
        }
      }

      // 🔗 LISTENER: Estado da conexão
      this.sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        console.log('🔔 Connection update:', { 
          connection, 
          hasQR: !!qr, 
          hasLastDisconnect: !!lastDisconnect,
          disconnectReason: (lastDisconnect?.error as Boom)?.output?.statusCode,
          errorMessage: lastDisconnect?.error?.message,
          fullUpdate: JSON.stringify(update)
        });
        
        if (qr) {
          // 🎯 QR CODE GERADO - CONVERTIR PARA IMAGEM
          this.qrCode = qr;
          QRCode.toDataURL(qr, {
            width: 256,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' }
          }).then(dataURL => {
            this.qrImage = dataURL;
          }).catch(err => console.error('Erro ao gerar QR image:', err));
          
          console.log('📱 QR Code gerado para conexão');
          
          // 🔄 Iniciar timer de renovação automática do QR (2 minutos)
          this.startQRRefreshTimer();
        }

        if (connection === 'open') {
          // ✅ CONECTADO COM SUCESSO
          this.isReady = true;
          this.connectionStatus.connected = true;
          this.connectionStatus.status = 'connected';
          this.connectionStatus.phoneNumber = this.sock?.user?.id?.split(':')[0] || '';
          
          // 🛑 Parar timer de renovação do QR quando conectado
          this.stopQRRefreshTimer();
          
          console.log('🎉 WhatsApp conectado com sucesso!');
          
          console.log('✅ WhatsApp conectado - status atualizado internamente');
        } 
        else if (connection === 'close') {
          // ❌ CONEXÃO FECHADA
          this.isReady = false;
          this.connectionStatus.connected = false;
          this.connectionStatus.status = 'disconnected';
          
          console.log('❌ WhatsApp desconectado - status atualizado internamente');
        }
      });

      // 📨 LISTENER: Mensagens recebidas
      this.sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg?.key?.fromMe && msg?.message && this.currentUserId) {
          await this.handleIncomingMessage(msg);
        }
      });

      // 💾 SALVAR CREDENCIAIS QUANDO ATUALIZADAS
      this.sock.ev.on('creds.update', saveCreds);

    } catch (error) {
      console.error('❌ Erro ao inicializar socket WhatsApp:', error);
      throw error;
    }
  }

  // 📥 PROCESSAR MENSAGEM RECEBIDA (FUNIL AUTOMATIZADO)
  private async handleIncomingMessage(msg: proto.IWebMessageInfo) {
    try {
      const phoneNumber = msg.key.remoteJid?.split('@')[0] || '';
      const messageText = msg.message?.conversation || 
                          msg.message?.extendedTextMessage?.text || '';

      if (!phoneNumber || !messageText) return;

      console.log(`📨 Mensagem de ${phoneNumber}: ${messageText}`);

      // 🎯 VERIFICAR SE MENSAGEM CONTÉM GATILHO DE FUNIL ATIVO
      const funnels = await storage.getAllFunnels(this.currentUserId);
      const activeFunnels = funnels.filter(f => f.status === 'active');
      
      let matchedFunnel = null;
      const lowerMsg = messageText.toLowerCase().trim();
      
      for (const funnel of activeFunnels) {
        const triggerPhrases = funnel.triggerPhrases || [];
        const hasMatch = triggerPhrases.some(phrase => 
          lowerMsg.includes(phrase.toLowerCase().trim())
        );
        
        if (hasMatch) {
          matchedFunnel = funnel;
          console.log(`🎯 Gatilho detectado! Funil: ${funnel.name}, Mensagem: ${messageText}`);
          break;
        }
      }

      // 💾 SALVAR CONTATO APENAS SE HOUVER GATILHO DETECTADO
      if (!matchedFunnel) {
        console.log(`⚠️ Nenhum gatilho detectado para: "${messageText}"`);
        return;
      }

      let contact = await storage.getContactByPhone(phoneNumber, this.currentUserId);
      let contactId = contact?.id;

      if (!contact) {
        const newContact = await storage.createContact({
          name: `Cliente ${phoneNumber}`,
          phoneNumber: phoneNumber,
          userId: this.currentUserId,
          isActive: true
        });
        contactId = newContact.id;
        contact = newContact;
        console.log(`✅ Novo contato criado: ${phoneNumber}`);
      }

      await storage.createMessage({
        contactId: contactId!,
        content: messageText,
        type: 'text',
        status: 'delivered',
        userId: this.currentUserId
      });

      // 🎯 EXECUTAR FUNIL DETECTADO
      if (matchedFunnel && contactId) {
        try {
          // Importar funnelService dinamicamente para evitar dependência circular
          const { funnelService } = await import('./funnelService');
          await funnelService.executeFunnel(matchedFunnel.id, contactId, messageText);
          console.log(`✅ Funil "${matchedFunnel.name}" iniciado para contato ${phoneNumber}`);
        } catch (error) {
          console.error('❌ Erro ao executar funil:', error);
        }
      }

    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
    }
  }

  // 🚀 OBTER PAIRING CODE (Interface pública para routes.ts)
  async getPairingCode(userId: string, phoneNumber: string): Promise<string> {
    try {
      this.currentUserId = userId;

      if (this.isReady) {
        throw new Error('WhatsApp já está conectado');
      }

      // Marcar que estamos gerando código
      this.isGeneratingQR = true;

      // Limpar socket antigo se existir
      if (this.sock) {
        console.log('🔌 Fechando socket antigo...');
        this.sock.end(undefined);
        this.sock = null;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Limpar credenciais antigas antes de gerar novo código
      console.log('🧹 Limpando credenciais antigas...');
      const fs = await import('fs/promises');
      const authPath = './server/wa_auth';
      try {
        await fs.rm(authPath, { recursive: true, force: true });
        console.log('✅ Credenciais antigas removidas');
      } catch (err) {
        // Ignorar erro se pasta não existir
      }

      // Resetar códigos
      this.pairingCode = '';
      this.qrCode = '';
      this.qrImage = '';
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔄 Inicializando socket Baileys com pairing code...');
      await this.initializeSocket(phoneNumber);

      // Aguardar pairing code ser gerado
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.isGeneratingQR = false;
          reject(new Error('Timeout aguardando Pairing Code'));
        }, 10000);

        const checkCode = () => {
          if (this.pairingCode) {
            clearTimeout(timeout);
            this.isGeneratingQR = false;
            resolve(this.pairingCode);
          } else {
            setTimeout(checkCode, 500);
          }
        };
        checkCode();
      });

    } catch (error) {
      this.isGeneratingQR = false;
      console.error('❌ Erro ao gerar Pairing Code:', error);
      throw error;
    }
  }

  // 🚀 OBTER QR CODE (Mantido para compatibilidade)
  async getQRCode(userId: string): Promise<string> {
    try {
      this.currentUserId = userId;

      if (this.isReady) {
        throw new Error('WhatsApp já está conectado');
      }

      // Marcar que estamos gerando QR para evitar auto-reconnect
      this.isGeneratingQR = true;

      // Limpar socket antigo se existir
      if (this.sock) {
        console.log('🔌 Fechando socket antigo...');
        this.sock.end(undefined);
        this.sock = null;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Limpar credenciais antigas antes de gerar novo QR
      console.log('🧹 Limpando credenciais antigas...');
      const fs = await import('fs/promises');
      const authPath = './server/wa_auth';
      try {
        await fs.rm(authPath, { recursive: true, force: true });
        console.log('✅ Credenciais antigas removidas');
      } catch (err) {
        // Ignorar erro se pasta não existir
      }

      // Resetar QR codes
      this.qrCode = '';
      this.qrImage = '';
      this.pairingCode = '';
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔄 Inicializando socket Baileys...');
      await this.initializeSocket();

      // Aguardar QR Code ser gerado
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.isGeneratingQR = false;
          reject(new Error('Timeout aguardando QR Code'));
        }, 30000);

        const checkQR = () => {
          if (this.qrCode) {
            clearTimeout(timeout);
            this.isGeneratingQR = false;
            resolve(this.qrCode);
          } else {
            setTimeout(checkQR, 1000);
          }
        };
        checkQR();
      });

    } catch (error) {
      this.isGeneratingQR = false;
      console.error('❌ Erro ao gerar QR Code:', error);
      throw error;
    }
  }

  // 📊 OBTER STATUS DA CONEXÃO
  async getConnectionStatus(userId: string): Promise<WhatsAppConnection> {
    this.currentUserId = userId;
    return this.connectionStatus;
  }

  // 🔗 CONECTAR WHATSAPP (Compatibilidade com routes.ts)
  async connectWhatsApp(userId: string, phoneNumber: string): Promise<boolean> {
    this.currentUserId = userId;
    return this.isReady;
  }

  // 🛡️ ANTI-BAN: Configurações de segurança
  private messageQueue: Array<{ phoneNumber: string; message: string; userId: string; resolve: (value: boolean) => void }> = [];
  private isProcessingQueue = false;
  private messagesThisHour = 0;
  private hourlyResetTime = Date.now();
  private readonly MIN_DELAY_MS = 3000; // Mínimo 3 segundos entre mensagens
  private readonly MAX_DELAY_MS = 8000; // Máximo 8 segundos entre mensagens
  private readonly TYPING_DELAY_PER_CHAR = 50; // 50ms por caractere (simulando digitação)

  // 📊 Obter limite de mensagens por hora do plano do usuário
  private async getMaxMessagesPerHour(userId?: string): Promise<number> {
    try {
      const userIdToCheck = userId || this.currentUserId;
      if (userIdToCheck) {
        const user = await storage.getUser(userIdToCheck);
        if (user) {
          const planLimits = getPlanLimits(user.planType as PlanType);
          return planLimits.maxMessagesPerHour;
        }
      }
      // Fallback para limite básico se não houver usuário
      return getPlanLimits('basic').maxMessagesPerHour;
    } catch (error) {
      console.error('Erro ao obter limite do plano:', error);
      return 100; // Fallback seguro
    }
  }

  // 🎲 Gerar delay aleatório humanizado
  private getRandomDelay(): number {
    return Math.floor(Math.random() * (this.MAX_DELAY_MS - this.MIN_DELAY_MS + 1)) + this.MIN_DELAY_MS;
  }

  // ⌨️ Calcular tempo de digitação baseado no tamanho da mensagem
  private getTypingDelay(message: string): number {
    const baseTypingTime = message.length * this.TYPING_DELAY_PER_CHAR;
    const randomVariation = Math.random() * 1000; // Variação aleatória de até 1 segundo
    return Math.min(baseTypingTime + randomVariation, 5000); // Máximo 5 segundos de digitação
  }

  // 🔄 Resetar contador horário se necessário
  private checkHourlyReset(): void {
    const now = Date.now();
    if (now - this.hourlyResetTime >= 3600000) { // 1 hora
      this.messagesThisHour = 0;
      this.hourlyResetTime = now;
      console.log('🔄 Contador de mensagens por hora resetado');
    }
  }

  // 📤 ENVIAR MENSAGEM (com Anti-Ban)
  async sendMessage(phoneNumber: string, message: string, userId?: string): Promise<boolean> {
    return new Promise((resolve) => {
      const userIdToUse = userId || this.currentUserId || 'default-user';
      this.messageQueue.push({ phoneNumber, message, userId: userIdToUse, resolve });
      this.processQueue();
    });
  }

  // 🔄 Processar fila de mensagens com delays
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.messageQueue.length > 0) {
      this.checkHourlyReset();

      // Peek primeiro item para obter o userId
      const peekItem = this.messageQueue[0];
      if (!peekItem) break;

      // Obter limite do plano do usuário usando o userId do item
      const maxMessagesPerHour = await this.getMaxMessagesPerHour(peekItem.userId);

      // Verificar limite por hora
      if (this.messagesThisHour >= maxMessagesPerHour) {
        console.log(`⚠️ Limite de mensagens por hora atingido (${maxMessagesPerHour}). Aguardando...`);
        const waitTime = 3600000 - (Date.now() - this.hourlyResetTime);
        await new Promise(r => setTimeout(r, Math.min(waitTime, 60000))); // Esperar até 1 minuto
        continue;
      }

      const item = this.messageQueue.shift();
      if (!item) continue;

      try {
        if (!this.sock || !this.isReady) {
          console.error('❌ WhatsApp não está conectado');
          item.resolve(false);
          continue;
        }

        const jid = `${item.phoneNumber}@s.whatsapp.net`;

        // 🔵 Simular "digitando..." antes de enviar
        const typingDelay = this.getTypingDelay(item.message);
        console.log(`⌨️ Simulando digitação por ${typingDelay}ms para ${item.phoneNumber}...`);
        
        await this.sock.sendPresenceUpdate('composing', jid);
        await new Promise(r => setTimeout(r, typingDelay));
        await this.sock.sendPresenceUpdate('paused', jid);

        // 📤 Enviar mensagem
        await this.sock.sendMessage(jid, { text: item.message });
        this.messagesThisHour++;

        console.log(`✅ [Anti-Ban] Mensagem ${this.messagesThisHour}/${maxMessagesPerHour}/h enviada para ${item.phoneNumber}`);
        item.resolve(true);

        // ⏳ Delay aleatório antes da próxima mensagem
        if (this.messageQueue.length > 0) {
          const delay = this.getRandomDelay();
          console.log(`⏳ Aguardando ${delay}ms antes da próxima mensagem...`);
          await new Promise(r => setTimeout(r, delay));
        }

      } catch (error) {
        console.error(`❌ Erro ao enviar mensagem para ${item.phoneNumber}:`, error);
        item.resolve(false);
        
        // Delay extra em caso de erro (pode ser rate limit do WhatsApp)
        await new Promise(r => setTimeout(r, 10000)); // 10 segundos
      }
    }

    this.isProcessingQueue = false;
  }

  // 📊 Obter estatísticas anti-ban
  async getAntiBanStats(): Promise<{ messagesThisHour: number; maxPerHour: number; queueSize: number }> {
    this.checkHourlyReset();
    const maxPerHour = await this.getMaxMessagesPerHour();
    return {
      messagesThisHour: this.messagesThisHour,
      maxPerHour,
      queueSize: this.messageQueue.length,
    };
  }

  // 🔄 INICIAR TIMER DE RENOVAÇÃO DO QR CODE (a cada 2 minutos)
  private startQRRefreshTimer() {
    // Limpar timer anterior se existir
    this.stopQRRefreshTimer();
    
    // Iniciar novo timer de 2 minutos (120000ms)
    this.qrRefreshTimer = setTimeout(async () => {
      if (!this.isReady) {
        console.log('🔄 Renovando QR Code após 2 minutos...');
        await this.forceNewQRCode();
      }
    }, 120000); // 2 minutos
    
    console.log('⏱️ Timer de renovação do QR Code iniciado (2 minutos)');
  }

  // 🛑 PARAR TIMER DE RENOVAÇÃO DO QR CODE
  private stopQRRefreshTimer() {
    if (this.qrRefreshTimer) {
      clearTimeout(this.qrRefreshTimer);
      this.qrRefreshTimer = null;
      console.log('⏹️ Timer de renovação do QR Code parado');
    }
  }

  // 🆕 FORÇAR GERAÇÃO DE NOVO QR CODE
  private async forceNewQRCode() {
    try {
      console.log('🔄 Forçando geração de novo QR Code...');
      
      this.isGeneratingQR = true;
      
      // Fechar socket atual
      if (this.sock) {
        this.sock.end(undefined);
        this.sock = null;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Limpar credenciais para forçar novo QR
      const fs = await import('fs/promises');
      const authPath = './server/wa_auth';
      try {
        await fs.rm(authPath, { recursive: true, force: true });
        console.log('🗑️ Credenciais antigas removidas');
      } catch (err) {
        // Ignorar erro se pasta não existir
      }
      
      // Reinicializar socket para gerar novo QR
      this.qrCode = '';
      this.qrImage = '';
      
      await new Promise(resolve => setTimeout(resolve, 500));
      await this.initializeSocket();
      
      // Resetar flag após inicializar
      this.isGeneratingQR = false;
      
      // Reiniciar o timer de renovação mesmo que o QR não seja gerado imediatamente
      // Isso garante que a renovação continue acontecendo a cada 2 minutos
      if (!this.isReady) {
        this.startQRRefreshTimer();
      }
      
    } catch (error) {
      console.error('❌ Erro ao forçar novo QR Code:', error);
      this.isGeneratingQR = false;
      // Mesmo em caso de erro, reiniciar o timer para tentar novamente
      if (!this.isReady) {
        this.startQRRefreshTimer();
      }
    }
  }

  // 🔌 DESCONECTAR E GERAR NOVO QR CODE
  async disconnect(): Promise<void> {
    // Parar timer de renovação
    this.stopQRRefreshTimer();
    
    if (this.sock) {
      this.sock.end(undefined);
      this.sock = null;
      this.isReady = false;
      this.qrCode = '';
      this.qrImage = '';
      console.log('🔌 WhatsApp desconectado');
      
      // Limpar credenciais para permitir conectar outro número
      const fs = await import('fs/promises');
      const authPath = './server/wa_auth';
      try {
        await fs.rm(authPath, { recursive: true, force: true });
        console.log('🗑️ Credenciais removidas - pronto para conectar outro número');
      } catch (err) {
        console.error('❌ Erro ao remover credenciais:', err);
      }
    }
  }

  // 🎯 GETTER PARA QR IMAGE (usado pelo routes.ts)
  get qrCodeImage(): string {
    return this.qrImage;
  }
}

// Singleton instance
export const whatsappService = new WhatsAppService();