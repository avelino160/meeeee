import makeWASocket, { 
  ConnectionState, 
  WASocket, 
  useMultiFileAuthState,
  DisconnectReason,
  proto
} from 'baileys';
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
  private isReady: boolean = false;
  private currentUserId: string = '';
  private connectionStatus: WhatsAppConnection = {
    connected: false,
    status: 'disconnected'
  };

  constructor() {
    console.log('🚀 WhatsAppService inicializado com Baileys');
  }

  // 📱 INICIALIZAR SOCKET BAILEYS
  private async initializeSocket() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState('./server/wa_auth');
      
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['ZapRápido', 'Chrome', '1.0.0'],
      });

      // 🔗 LISTENER: Estado da conexão
      this.sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
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
        }

        if (connection === 'open') {
          // ✅ CONECTADO COM SUCESSO
          this.isReady = true;
          this.connectionStatus.connected = true;
          this.connectionStatus.status = 'connected';
          this.connectionStatus.phoneNumber = this.sock?.user?.id?.split(':')[0] || '';
          
          console.log('🎉 WhatsApp conectado com sucesso!');
          
          console.log('✅ WhatsApp conectado - status atualizado internamente');
        } 
        else if (connection === 'close') {
          // ❌ CONEXÃO FECHADA
          this.isReady = false;
          this.connectionStatus.connected = false;
          this.connectionStatus.status = 'disconnected';
          
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          
          console.log('🔄 Conexão fechada. Reconectar?', shouldReconnect);
          
          if (shouldReconnect) {
            // Auto-reconectar se não foi logout manual
            setTimeout(() => this.initializeSocket(), 5000);
          }
          
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

      // 💾 SALVAR CONTATO E MENSAGEM
      const contact = await storage.getContactByPhone(phoneNumber, this.currentUserId);
      let contactId = contact?.id;

      if (!contact) {
        const newContact = await storage.createContact({
          name: `Cliente ${phoneNumber}`,
          phoneNumber: phoneNumber,
          userId: this.currentUserId
        });
        contactId = newContact.id;
      }

      await storage.createMessage({
        contactId: contactId!,
        content: messageText,
        direction: 'inbound',
        userId: this.currentUserId
      });

      // 🎯 FUNIL AUTOMATIZADO DE VENDAS
      let response = '';
      const lowerMsg = messageText.toLowerCase();

      if (lowerMsg.includes('oi') || lowerMsg.includes('olá') || lowerMsg.includes('bom dia') || 
          lowerMsg.includes('boa tarde') || lowerMsg.includes('boa noite') || lowerMsg.includes('hey')) {
        // 1️⃣ BOAS-VINDAS
        response = `🎉 Olá! Bem-vindo ao *ZapRápido*! 

Sou seu assistente automatizado de vendas 24/7! 🤖

Estou aqui para te ajudar a descobrir como nossa solução pode *transformar seus resultados*! 

Digite *"quero saber mais"* para descobrir como podemos aumentar suas vendas em até 300%! 🚀`;

      } else if (lowerMsg.includes('quero saber mais') || lowerMsg.includes('interessado') || lowerMsg.includes('contar mais')) {
        // 2️⃣ DESPERTAR CURIOSIDADE
        response = `🔥 Que incrível! Você está a um passo de descobrir o segredo que *milhares de empresas* já estão usando!

Nossa plataforma *ZapRápido* já ajudou mais de 10.000 empreendedores a:

✅ *Automatizar 100% das conversas*  
✅ *Responder clientes 24/7 sem parar*  
✅ *Aumentar vendas em até 300%*  
✅ *Economizar 15+ horas por semana*  

😱 Imagina ter um *vendedor que nunca dorme*, nunca tira férias e converte *3x mais*?

Digite *"quero essa solução"* para conhecer nossa oferta especial! 💰`;

      } else if (lowerMsg.includes('quero essa solução') || lowerMsg.includes('oferta') || lowerMsg.includes('preço') || lowerMsg.includes('valor')) {
        // 3️⃣ OFERTA IRRESISTÍVEL
        response = `🎯 *OFERTA EXCLUSIVA* - Apenas hoje!

Por apenas *R$ 97/mês* (menos de R$ 3 por dia ☕), você terá acesso COMPLETO ao ZapRápido:

🎁 *BÔNUS INCLUSOS:*  
✅ Setup completo gratuito (valor R$ 500)  
✅ 30 dias de suporte premium  
✅ Templates de funil prontos  
✅ Treinamento completo em vídeo  

⏰ *OFERTA LIMITADA:* Só até meia-noite!  
💥 *GARANTIA:* 7 dias para testar, risco ZERO!  

Digite *"quero comprar agora"* para garantir com *50% DE DESCONTO*! 🔥`;

      } else if (lowerMsg.includes('quero comprar') || lowerMsg.includes('fechar') || lowerMsg.includes('contratar')) {
        // 4️⃣ CALL-TO-ACTION
        response = `🎉 *PERFEITO!* Decisão inteligente!

Para finalizar seu acesso ao ZapRápido com *50% OFF*, clique no link abaixo:

🔗 *https://zaprapido.com/checkout*

Ou fale diretamente com nosso especialista:
📞 *WhatsApp:* (11) 99999-9999

✅ *Pagamento 100% seguro*  
✅ *Acesso liberado em 5 minutos*  
✅ *Suporte premium incluído*  

*Parabéns!* Você está prestes a revolucionar suas vendas! 🚀

Alguma dúvida antes de finalizar?`;

      } else {
        // 🤝 RESPOSTA PADRÃO AMIGÁVEL
        response = `🤖 Olá! Sou o assistente automático do *ZapRápido*!

Para te ajudar melhor, digite uma das opções:

🔹 *"quero saber mais"* - Conhecer nossa solução  
🔹 *"oferta"* - Ver promoções especiais  
🔹 *"suporte"* - Falar com especialista  

Estou aqui 24/7 para te ajudar! 🚀`;
      }

      // 📤 ENVIAR RESPOSTA AUTOMATIZADA
      await this.sendMessage(phoneNumber, response);

      // 💾 SALVAR RESPOSTA ENVIADA
      await storage.createMessage({
        contactId: contactId!,
        content: response,
        direction: 'outbound',
        userId: this.currentUserId
      });

    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
    }
  }

  // 🚀 OBTER QR CODE (Interface pública para routes.ts)
  async getQRCode(userId: string): Promise<string> {
    try {
      this.currentUserId = userId;

      if (this.isReady) {
        throw new Error('WhatsApp já está conectado');
      }

      if (!this.sock) {
        console.log('🔄 Inicializando socket Baileys...');
        await this.initializeSocket();
      }

      // Aguardar QR Code ser gerado
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout aguardando QR Code'));
        }, 30000);

        const checkQR = () => {
          if (this.qrCode) {
            clearTimeout(timeout);
            resolve(this.qrCode);
          } else {
            setTimeout(checkQR, 1000);
          }
        };
        checkQR();
      });

    } catch (error) {
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

  // 🔌 DESCONECTAR
  async disconnect(): Promise<void> {
    if (this.sock) {
      this.sock.end(undefined);
      this.sock = null;
      this.isReady = false;
      this.qrCode = '';
      this.qrImage = '';
      console.log('🔌 WhatsApp desconectado');
    }
  }

  // 🎯 GETTER PARA QR IMAGE (usado pelo routes.ts)
  get qrCodeImage(): string {
    return this.qrImage;
  }
}

// Singleton instance
export const whatsappService = new WhatsAppService();