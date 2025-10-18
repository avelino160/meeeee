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

  // 📤 ENVIAR MENSAGEM
  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      if (!this.sock || !this.isReady) {
        throw new Error('WhatsApp não está conectado');
      }

      const jid = `${phoneNumber}@s.whatsapp.net`;
      await this.sock.sendMessage(jid, { text: message });
      
      console.log(`✅ Mensagem enviada para ${phoneNumber}: ${message.substring(0, 50)}...`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem para ${phoneNumber}:`, error);
      return false;
    }
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