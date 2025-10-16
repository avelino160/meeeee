import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { whatsappService } from "./services/whatsappService";
import { funnelService } from "./services/funnelService";
import { schedulerService } from "./services/schedulerService";
import { 
  insertFunnelSchema,
  insertContactSchema,
  insertMessageSchema,
} from "@shared/schema";
import { z } from "zod";

const DEFAULT_USER_ID = "default-user";

// Guard: Detectar ambientes de datacenter (Replit, etc.)
function isDatacenterEnvironment(req: any): boolean {
  const hostname = req.hostname || req.get('host') || '';
  const forwardedHost = req.get('x-forwarded-host') || '';
  
  const datacenterHosts = [
    '.replit.',
    'replit.dev',
    '.repl.co',
    '.glitch.me',
    '.herokuapp.com',
    '.render.com',
  ];
  
  return datacenterHosts.some(dc => 
    hostname.includes(dc) || forwardedHost.includes(dc)
  );
}

export async function registerRoutes(app: Express): Promise<Server> {
  // WhatsApp connection routes
  app.get('/api/whatsapp/status', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const status = await whatsappService.getConnectionStatus(userId);
      res.json(status);
    } catch (error) {
      console.error("Error getting WhatsApp status:", error);
      res.status(500).json({ message: "Failed to get WhatsApp status" });
    }
  });

  app.post('/api/whatsapp/qr', async (req, res) => {
    // 🛡️ GUARD: Bloquear tentativas em ambientes de datacenter
    if (isDatacenterEnvironment(req)) {
      return res.status(405).json({
        message: "WhatsApp bloqueia conexões de servidores cloud. Execute o projeto localmente ou use VPS com IP residencial.",
        error: "datacenter_blocked",
        details: "O WhatsApp detecta e bloqueia conexões de datacenters (Replit, Heroku, etc.) por segurança. Consulte WHATSAPP_CONNECTION.md para soluções."
      });
    }

    try {
      const userId = DEFAULT_USER_ID;
      const qrCodeData = await whatsappService.getQRCode(userId);
      
      // 🔒 SEGURANÇA: QR gerado pelo Baileys no servidor, frontend renderiza
      const qrImageURL = whatsappService.qrCodeImage;
      
      res.json({ qrCode: qrCodeData, qrImage: qrImageURL });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  app.post('/api/whatsapp/pairing-code', async (req, res) => {
    // 🛡️ GUARD: Bloquear tentativas em ambientes de datacenter
    if (isDatacenterEnvironment(req)) {
      return res.status(405).json({
        message: "WhatsApp bloqueia conexões de servidores cloud. Execute o projeto localmente ou use VPS com IP residencial.",
        error: "datacenter_blocked",
        details: "O WhatsApp detecta e bloqueia conexões de datacenters (Replit, Heroku, etc.) por segurança. Consulte WHATSAPP_CONNECTION.md para soluções."
      });
    }

    try {
      const userId = DEFAULT_USER_ID;
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      // Remover caracteres não numéricos do telefone
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      const pairingCode = await whatsappService.getPairingCode(userId, cleanPhone);
      res.json({ pairingCode });
    } catch (error: any) {
      console.error("Error generating pairing code:", error);
      
      // Identificar erro 405 do WhatsApp (bloqueio de datacenter)
      if (error.output?.statusCode === 405 || error.message?.includes('Connection Failure') || error.message?.includes('Connection Closed')) {
        return res.status(405).json({ 
          message: "WhatsApp bloqueou a conexão deste ambiente. Execute o projeto localmente ou use VPS com IP residencial.",
          error: "datacenter_blocked",
          details: "O WhatsApp detectou que esta conexão vem de um datacenter e bloqueou por segurança. Consulte WHATSAPP_CONNECTION.md para soluções."
        });
      }
      
      res.status(500).json({ message: "Failed to generate pairing code" });
    }
  });

  app.post('/api/whatsapp/connect', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const success = await whatsappService.connectWhatsApp(userId, phoneNumber);
      res.json({ success });
    } catch (error) {
      console.error("Error connecting WhatsApp:", error);
      res.status(500).json({ message: "Failed to connect WhatsApp" });
    }
  });

  app.post('/api/whatsapp/disconnect', async (req, res) => {
    try {
      await whatsappService.disconnect();
      res.json({ success: true });
    } catch (error) {
      console.error("Error disconnecting WhatsApp:", error);
      res.status(500).json({ message: "Failed to disconnect WhatsApp" });
    }
  });

  // Funnel routes
  app.get('/api/funnels', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const funnels = await storage.getAllFunnels(userId);
      res.json(funnels);
    } catch (error) {
      console.error("Error fetching funnels:", error);
      res.status(500).json({ message: "Failed to fetch funnels" });
    }
  });

  app.post('/api/funnels', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const funnelData = insertFunnelSchema.parse({ ...req.body, userId });
      const funnel = await storage.createFunnel(funnelData);
      res.status(201).json(funnel);
    } catch (error) {
      console.error("Error creating funnel:", error);
      res.status(500).json({ message: "Failed to create funnel" });
    }
  });

  app.put('/api/funnels/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const funnel = await storage.updateFunnel(id, req.body);
      res.json(funnel);
    } catch (error) {
      console.error("Error updating funnel:", error);
      res.status(500).json({ message: "Failed to update funnel" });
    }
  });

  app.delete('/api/funnels/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFunnel(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting funnel:", error);
      res.status(500).json({ message: "Failed to delete funnel" });
    }
  });

  app.post('/api/funnels/:id/execute', async (req, res) => {
    try {
      const { id } = req.params;
      const { contactId, triggerMessage } = req.body;
      
      await funnelService.executeFunnel(id, contactId, triggerMessage);
      res.json({ success: true });
    } catch (error) {
      console.error("Error executing funnel:", error);
      res.status(500).json({ message: "Failed to execute funnel" });
    }
  });

  app.get('/api/funnels/:id/stats', async (req, res) => {
    try {
      const { id } = req.params;
      const stats = await funnelService.getFunnelStats(id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching funnel stats:", error);
      res.status(500).json({ message: "Failed to fetch funnel stats" });
    }
  });

  // Contact routes
  app.get('/api/contacts', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const contacts = await storage.getContacts(userId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post('/api/contacts', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const contactData = insertContactSchema.parse({ ...req.body, userId });
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.put('/api/contacts/:id', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { id } = req.params;
      
      // Verify ownership
      const existingContact = await storage.getContact(id, userId);
      if (!existingContact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      const contact = await storage.updateContact(id, req.body);
      res.json(contact);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete('/api/contacts/:id', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { id } = req.params;
      
      const success = await storage.deleteContact(id, userId);
      if (!success) {
        return res.status(404).json({ message: "Contact not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Message routes
  app.get('/api/messages', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { limit } = req.query;
      const messages = await storage.getMessages(userId, limit ? parseInt(limit as string) : undefined);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages/send', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { contactId, content, type, mediaUrl, scheduledAt } = req.body;

      if (scheduledAt) {
        // Schedule the message
        const messageId = await schedulerService.scheduleMessage(
          userId,
          contactId,
          content,
          type,
          new Date(scheduledAt),
          mediaUrl
        );
        res.json({ messageId, scheduled: true });
      } else {
        // Send immediately
        const contact = await storage.getContact(contactId, userId);
        if (!contact) {
          return res.status(404).json({ message: "Contact not found" });
        }

        const success = await whatsappService.sendMessage(
          contact.phoneNumber,
          content
        );

        const message = await storage.createMessage({
          userId,
          contactId,
          type,
          content,
          mediaUrl,
          status: success ? 'sent' : 'failed',
          sentAt: new Date(),
        });

        res.json(message);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/dashboard', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      
      // Get basic stats
      const funnels = await storage.getAllFunnels(userId);
      const contacts = await storage.getContacts(userId);
      const messages = await storage.getMessages(userId, 1000);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayMessages = messages.filter(m => 
        m.createdAt && new Date(m.createdAt) >= today
      );
      
      const sentMessages = messages.filter(m => m.status === 'sent');
      const deliveredMessages = messages.filter(m => m.status === 'delivered');
      
      const analytics = {
        totalFunnels: funnels.length,
        activeFunnels: funnels.filter(f => f.status === 'active').length,
        totalContacts: contacts.length,
        activeContacts: contacts.filter(c => c.isActive).length,
        totalMessages: messages.length,
        todayMessages: todayMessages.length,
        sentMessages: sentMessages.length,
        deliveredMessages: deliveredMessages.length,
        deliveryRate: sentMessages.length > 0 ? (deliveredMessages.length / sentMessages.length) * 100 : 0,
        schedulerTasks: schedulerService.getActiveTasksCount(),
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
