import { storage } from '../storage';
import { baileyService } from './baileyService';

export class WhatsAppService {
  constructor() {
    console.log('🐝 WhatsAppService inicializado via Baileys');
  }

  async getConnectionStatus(userId: string): Promise<{ connected: boolean; status: string; phoneNumber?: string }> {
    try {
      const connections = await storage.getAllWhatsappConnections(userId);
      const conn = connections.find(c => c.isConnected);
      if (conn) {
        return {
          connected: true,
          status: 'connected',
          phoneNumber: conn.phoneNumber,
        };
      }
      return { connected: false, status: 'disconnected' };
    } catch {
      return { connected: false, status: 'disconnected' };
    }
  }

  async sendMessage(phoneNumber: string, message: string, userId?: string): Promise<boolean> {
    try {
      const uid = userId || 'default-user';
      const connections = await storage.getAllWhatsappConnections(uid);
      const conn = connections.find(c => c.isConnected);
      if (!conn) {
        console.error('❌ Nenhuma conexão ativa para enviar mensagem');
        return false;
      }
      return await baileyService.sendMessage(conn.id, phoneNumber, message);
    } catch (err) {
      console.error('❌ Erro ao enviar mensagem:', err);
      return false;
    }
  }

  async getAntiBanStats() {
    return { messagesThisHour: 0, maxPerHour: 1000, queueSize: 0 };
  }

  // Stubs mantidos para compatibilidade
  async getPairingCode(_userId: string, _phone: string): Promise<string> { return ''; }
}

export const whatsappService = new WhatsAppService();
