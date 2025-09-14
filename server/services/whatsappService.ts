import { storage } from "../storage";

interface OneMessageResponse {
  status: string;
  message: string;
  data?: any;
}

interface SendMessageParams {
  to: string;
  message: string;
  type?: "text" | "image" | "video" | "audio" | "document";
  mediaUrl?: string;
}

export class WhatsAppService {
  private appkey: string;
  private authkey: string;
  private baseUrl = "https://app.onemsg.io/api";

  constructor() {
    this.appkey = process.env.ONEMSG_APP_KEY || "2a083fca-e0cd-4899-89c1-8b8758a129e0";
    this.authkey = process.env.ONEMSG_AUTH_KEY || "Vt747KVGqA2oxnn7arhzLHWEKCPoTBnL9pwxcaI7y3C8U5KTLB";
  }

  async sendMessage(params: SendMessageParams): Promise<OneMessageResponse> {
    try {
      const formData = new FormData();
      formData.append('appkey', this.appkey);
      formData.append('authkey', this.authkey);
      formData.append('to', params.to);
      formData.append('message', params.message);
      formData.append('sandbox', 'false');

      if (params.mediaUrl && params.type !== 'text') {
        formData.append('media_url', params.mediaUrl);
        formData.append('type', params.type || 'text');
      }

      const response = await fetch(`${this.baseUrl}/create-message`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${data.message || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('WhatsApp send message error:', error);
      throw error;
    }
  }

  async getQRCode(userId: string): Promise<string> {
    try {
      // In a real implementation, this would generate a QR code for WhatsApp Web connection
      // For now, we'll simulate this by returning a placeholder QR code data
      const qrData = `ranzap_${userId}_${Date.now()}`;
      
      // Update the WhatsApp connection with the QR code
      const connection = await storage.getWhatsappConnection(userId);
      if (connection) {
        await storage.updateWhatsappConnection(connection.id, {
          qrCode: qrData,
          isConnected: false,
        });
      } else {
        await storage.createWhatsappConnection({
          userId,
          phoneNumber: '',
          qrCode: qrData,
          isConnected: false,
        });
      }

      return qrData;
    } catch (error) {
      console.error('Generate QR code error:', error);
      throw error;
    }
  }

  async connectWhatsApp(userId: string, phoneNumber: string): Promise<boolean> {
    try {
      const connection = await storage.getWhatsappConnection(userId);
      
      if (connection) {
        await storage.updateWhatsappConnection(connection.id, {
          phoneNumber,
          isConnected: true,
          lastConnectedAt: new Date(),
          qrCode: null,
        });
      } else {
        await storage.createWhatsappConnection({
          userId,
          phoneNumber,
          isConnected: true,
          lastConnectedAt: new Date(),
        });
      }

      return true;
    } catch (error) {
      console.error('Connect WhatsApp error:', error);
      return false;
    }
  }

  async disconnectWhatsApp(userId: string): Promise<boolean> {
    try {
      const connection = await storage.getWhatsappConnection(userId);
      
      if (connection) {
        await storage.updateWhatsappConnection(connection.id, {
          isConnected: false,
          qrCode: null,
        });
      }

      return true;
    } catch (error) {
      console.error('Disconnect WhatsApp error:', error);
      return false;
    }
  }

  async getConnectionStatus(userId: string): Promise<{ connected: boolean; phoneNumber?: string }> {
    try {
      const connection = await storage.getWhatsappConnection(userId);
      
      return {
        connected: connection?.isConnected || false,
        phoneNumber: connection?.phoneNumber,
      };
    } catch (error) {
      console.error('Get connection status error:', error);
      return { connected: false };
    }
  }

  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/\s+/g, ''));
  }
}

export const whatsappService = new WhatsAppService();
