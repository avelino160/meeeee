import axios from 'axios';
import { storage } from '../storage';
import { getPlanLimits, type PlanType } from '@shared/plan-limits';

interface WhatsAppConnection {
  connected: boolean;
  phoneNumber?: string;
  status: string;
}

export class WhatsAppService {
  private isReady: boolean = false;
  private currentUserId: string = '';
  private connectionStatus: WhatsAppConnection = {
    connected: false,
    status: 'disconnected'
  };

  private readonly API_URL = "https://api.green-api.com";

  constructor() {
    console.log('🚀 WhatsAppService inicializado com Green API');
  }

  // Helper para chamadas Green API
  private async callGreenAPI(method: string, idInstance: string, apiToken: string, payload?: any) {
    const url = `${this.API_URL}/waInstance${idInstance}/${method}/${apiToken}`;
    try {
      if (payload) {
        const response = await axios.post(url, payload);
        return response.data;
      } else {
        const response = await axios.get(url);
        return response.data;
      }
    } catch (error: any) {
      console.error(`❌ Erro na Green API (${method}):`, error.response?.data || error.message);
      throw error;
    }
  }

  async getConnectionStatus(userId: string): Promise<WhatsAppConnection> {
    try {
      this.currentUserId = userId;
      const connections = await storage.getAllWhatsappConnections(userId);
      const conn = connections[0];

      if (!conn || !conn.idInstance || !conn.apiTokenInstance) {
        return { connected: false, status: 'disconnected' };
      }

      const state = await this.callGreenAPI('getStateInstance', conn.idInstance, conn.apiTokenInstance);
      const isConnected = state.stateInstance === 'authorized';
      
      this.isReady = isConnected;
      this.connectionStatus = {
        connected: isConnected,
        status: isConnected ? 'connected' : 'disconnected',
        phoneNumber: conn.phoneNumber
      };

      return this.connectionStatus;
    } catch (error) {
      return { connected: false, status: 'disconnected' };
    }
  }

  async sendMessage(phoneNumber: string, message: string, userId?: string): Promise<boolean> {
    try {
      const uid = userId || this.currentUserId;
      const connections = await storage.getAllWhatsappConnections(uid);
      const conn = connections[0];

      if (!conn || !conn.idInstance || !conn.apiTokenInstance) {
        console.error("❌ Green API credentials missing for user:", uid);
        return false;
      }

      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const chatId = `${cleanPhone}@c.us`;

      await this.callGreenAPI('sendMessage', conn.idInstance, conn.apiTokenInstance, {
        chatId,
        message
      });

      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via Green API:', error);
      return false;
    }
  }

  // Stubs para compatibilidade com rotas existentes
  async getQRCode(userId: string): Promise<string> { return ""; }
  async getPairingCode(userId: string, phoneNumber: string): Promise<string> { return ""; }
  async connectWhatsApp(userId: string, phoneNumber: string): Promise<boolean> { return true; }
  async disconnect(): Promise<void> {}
  async getAntiBanStats() { 
    return { 
      messagesThisHour: 0, 
      maxPerHour: 100, 
      queueSize: 0 
    }; 
  }
  get qrCodeImage(): string { return ""; }
}

export const whatsappService = new WhatsAppService();