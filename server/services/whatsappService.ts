import { storage } from "../storage";
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import QRCode from 'qrcode';
import * as qrTerminal from 'qrcode-terminal';

interface SendMessageParams {
  to: string;
  message: string;
  type?: "text" | "image" | "video" | "audio" | "document";
  mediaUrl?: string;
}

interface WhatsAppResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class WhatsAppService {
  private client: Client | null = null;
  private qrCode: string | null = null;
  private isReady: boolean = false;
  private currentUserId: string | null = null;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      this.client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        }
      });

      this.client.on('qr', (qr) => {
        this.qrCode = qr;
        console.log('QR RECEBIDO! Escaneie com seu WhatsApp:');
        qrTerminal.generate(qr, { small: true });
      });

      this.client.on('ready', async () => {
        console.log('✅ WhatsApp conectado com sucesso!');
        this.isReady = true;
        
        if (this.currentUserId) {
          await this.updateConnectionStatus(this.currentUserId, true);
        }
      });

      this.client.on('authenticated', () => {
        console.log('WhatsApp autenticado!');
      });

      this.client.on('auth_failure', (msg) => {
        console.error('❌ Falha na autenticação:', msg);
      });

      this.client.on('disconnected', async (reason) => {
        console.log('❌ WhatsApp desconectado:', reason);
        this.isReady = false;
        if (this.currentUserId) {
          await this.updateConnectionStatus(this.currentUserId, false);
        }
      });

      // Listener para mensagens recebidas - FUNIL AUTOMATIZADO
      this.client.on('message', async (message) => {
        if (!message.from.endsWith('@c.us')) return; // Ignorar mensagens de grupos
        
        await this.handleIncomingMessage(message);
      });

    } catch (error) {
      console.error('Erro ao inicializar cliente WhatsApp:', error);
    }
  }

  private async handleIncomingMessage(message: any): Promise<void> {
    try {
      const phoneNumber = message.from.replace('@c.us', '');
      const messageText = message.body.toLowerCase().trim();
      
      if (!this.currentUserId) return;

      // Buscar ou criar contato
      let contact = await storage.getContactByPhone(phoneNumber, this.currentUserId);
      if (!contact) {
        contact = await storage.createContact({
          userId: this.currentUserId,
          phoneNumber: `+${phoneNumber}`,
          name: message._data.notifyName || 'Novo Contato',
          isActive: true
        });
      }

      // Salvar mensagem recebida
      await storage.createMessage({
        userId: this.currentUserId,
        contactId: contact.id,
        type: 'text',
        content: message.body,
        status: 'received',
        sentAt: new Date()
      });

      // 🚀 FUNIL AUTOMATIZADO ZapRápido
      await this.executeFunnelStep(phoneNumber, messageText, contact.id);

    } catch (error) {
      console.error('Erro ao processar mensagem recebida:', error);
    }
  }

  private async executeFunnelStep(phoneNumber: string, messageText: string, contactId: string): Promise<void> {
    try {
      // ETAPA 1: Boas-vindas
      if (messageText.includes('oi') || messageText.includes('olá') || messageText.includes('hello')) {
        await this.sendFunnelMessage(phoneNumber, 
          '👋 Olá! Bem-vindo ao ZapRápido!\n\n🎯 Aqui você vai descobrir como automatizar suas vendas no WhatsApp e aumentar seus resultados!\n\n📱 Digite *"quero saber mais"* para conhecer nossa solução completa!'
        );
        return;
      }

      // ETAPA 2: Despertar curiosidade
      if (messageText.includes('quero saber mais') || messageText.includes('saber mais')) {
        await this.sendFunnelMessage(phoneNumber,
          '🚀 Que ótimo!\n\nImagine poder:\n\n✅ Responder clientes automaticamente 24/7\n✅ Criar funis de venda no WhatsApp\n✅ Agendar mensagens\n✅ Gerenciar todos os contatos\n✅ Aumentar suas vendas em até 300%\n\n💡 Isso é possível com nosso sistema!\n\n🎁 Digite *"quero a oferta"* para ver nossa condição especial!'
        );
        return;
      }

      // ETAPA 3: Oferta irresistível
      if (messageText.includes('quero a oferta') || messageText.includes('oferta')) {
        await this.sendFunnelMessage(phoneNumber,
          '🔥 OFERTA ESPECIAL PARA VOCÊ!\n\n💎 ZapRápido PRO por apenas:\n\n~~R$ 297,00~~\n🎯 **R$ 97,00** (67% OFF)\n\n🎁 BÔNUS INCLUSOS:\n✅ Setup completo gratuito\n✅ Suporte VIP por 30 dias\n✅ Templates prontos\n✅ Treinamento exclusivo\n\n⏰ *Oferta válida apenas hoje!*\n\n💳 Digite *"quero comprar"* para garantir!'
        );
        return;
      }

      // ETAPA 4: Call-to-action final
      if (messageText.includes('quero comprar') || messageText.includes('comprar')) {
        await this.sendFunnelMessage(phoneNumber,
          '🎉 PERFEITO! Você tomou a melhor decisão!\n\n📲 Clique no link abaixo para finalizar sua compra:\n👉 https://pay.hotmart.com/zaprápido-pro\n\n🔒 Pagamento 100% seguro\n💳 Parcelamos em até 12x\n✅ Acesso imediato após aprovação\n\n❓ Dúvidas? Digite *"suporte"*\n\n🚀 Bem-vindo ao time ZapRápido!'
        );
        return;
      }

      // Mensagens de suporte
      if (messageText.includes('suporte') || messageText.includes('ajuda') || messageText.includes('dúvida')) {
        await this.sendFunnelMessage(phoneNumber,
          '🆘 Suporte ZapRápido\n\n📞 WhatsApp: (11) 99999-9999\n📧 Email: suporte@zaprápido.com\n🕐 Atendimento: 8h às 18h\n\n💬 Ou digite sua dúvida que respondo em breve!\n\n🔄 Para ver a oferta novamente, digite *"quero a oferta"*'
        );
        return;
      }

      // Mensagem padrão para textos não reconhecidos
      if (Math.random() > 0.7) { // 30% de chance de responder
        await this.sendFunnelMessage(phoneNumber,
          '👋 Oi! Vi sua mensagem!\n\n🎯 Para conhecer o ZapRápido, digite:\n*"quero saber mais"*\n\n🎁 Para ver nossa oferta especial:\n*"quero a oferta"*\n\n✨ Estou aqui para ajudar!'
        );
      }

    } catch (error) {
      console.error('Erro ao executar etapa do funil:', error);
    }
  }

  private async sendFunnelMessage(to: string, message: string): Promise<void> {
    try {
      if (!this.client || !this.isReady) return;
      
      const chatId = `${to}@c.us`;
      await this.client.sendMessage(chatId, message);
      
      // Salvar mensagem enviada no banco
      if (this.currentUserId) {
        const contact = await storage.getContactByPhone(`+${to}`, this.currentUserId);
        if (contact) {
          await storage.createMessage({
            userId: this.currentUserId,
            contactId: contact.id,
            type: 'text',
            content: message,
            status: 'sent',
            sentAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem do funil:', error);
    }
  }

  async sendMessage(params: SendMessageParams): Promise<WhatsAppResponse> {
    try {
      if (!this.client || !this.isReady) {
        return {
          success: false,
          message: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.'
        };
      }

      const chatId = `${params.to.replace('+', '')}@c.us`;
      let sentMessage;

      if (params.type === 'text' || !params.type) {
        sentMessage = await this.client.sendMessage(chatId, params.message);
      } else if (params.mediaUrl) {
        const media = await MessageMedia.fromUrl(params.mediaUrl);
        sentMessage = await this.client.sendMessage(chatId, media, { caption: params.message });
      }

      return {
        success: true,
        message: 'Mensagem enviada com sucesso!',
        data: { id: sentMessage?.id?.id }
      };
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return {
        success: false,
        message: `Erro ao enviar mensagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  async getQRCode(userId: string): Promise<string> {
    try {
      this.currentUserId = userId;
      
      if (this.isReady) {
        throw new Error('WhatsApp já está conectado');
      }

      if (!this.client) {
        await this.initializeClient();
      }

      // Inicializar cliente se ainda não foi
      if (!this.client) {
        throw new Error('Erro ao inicializar cliente WhatsApp');
      }

      await this.client.initialize();

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
      console.error('Erro ao gerar QR Code:', error);
      throw error;
    }
  }

  async connectWhatsApp(userId: string, phoneNumber: string): Promise<boolean> {
    // Esta função será chamada automaticamente quando o QR for escaneado
    return this.isReady;
  }

  async disconnectWhatsApp(userId: string): Promise<boolean> {
    try {
      if (this.client) {
        await this.client.destroy();
        this.client = null;
        this.isReady = false;
        this.qrCode = null;
        this.currentUserId = null;
      }

      await this.updateConnectionStatus(userId, false);
      return true;
    } catch (error) {
      console.error('Erro ao desconectar WhatsApp:', error);
      return false;
    }
  }

  async getConnectionStatus(userId: string): Promise<{ connected: boolean; phoneNumber?: string }> {
    try {
      const connection = await storage.getWhatsappConnection(userId);
      
      return {
        connected: this.isReady && (connection?.isConnected || false),
        phoneNumber: connection?.phoneNumber,
      };
    } catch (error) {
      console.error('Erro ao obter status da conexão:', error);
      return { connected: false };
    }
  }

  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/\s+/g, ''));
  }

  private async updateConnectionStatus(userId: string, connected: boolean): Promise<void> {
    try {
      const connection = await storage.getWhatsappConnection(userId);
      
      if (connection) {
        await storage.updateWhatsappConnection(connection.id, {
          isConnected: connected,
          lastConnectedAt: connected ? new Date() : connection.lastConnectedAt,
          qrCode: connected ? null : connection.qrCode,
        });
      } else if (connected) {
        await storage.createWhatsappConnection({
          userId,
          phoneNumber: '',
          isConnected: connected,
          lastConnectedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar status da conexão:', error);
    }
  }
}

export const whatsappService = new WhatsAppService();
