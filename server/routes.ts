import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { whatsappService } from "./services/whatsappService";
import { funnelService } from "./services/funnelService";
import { schedulerService } from "./services/schedulerService";
import { 
  insertCampaignSchema,
  insertFunnelSchema,
  insertContactSchema,
  insertMessageSchema,
  insertMessageTemplateSchema,
} from "@shared/schema";
import { z } from "zod";

const DEFAULT_USER_ID = "default-user";

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

  // Campaign routes
  app.get('/api/campaigns', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const campaigns = await storage.getCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post('/api/campaigns', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const campaignData = insertCampaignSchema.parse({ ...req.body, userId });
      const campaign = await storage.createCampaign(campaignData);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.get('/api/campaigns/:id', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { id } = req.params;
      const campaign = await storage.getCampaign(id, userId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.put('/api/campaigns/:id', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { id } = req.params;
      
      // Verify ownership
      const existingCampaign = await storage.getCampaign(id, userId);
      if (!existingCampaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      const campaign = await storage.updateCampaign(id, req.body);
      res.json(campaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.delete('/api/campaigns/:id', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { id } = req.params;
      
      const success = await storage.deleteCampaign(id, userId);
      if (!success) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  // Funnel routes
  app.get('/api/campaigns/:campaignId/funnels', async (req, res) => {
    try {
      const { campaignId } = req.params;
      const funnels = await storage.getFunnels(campaignId);
      res.json(funnels);
    } catch (error) {
      console.error("Error fetching funnels:", error);
      res.status(500).json({ message: "Failed to fetch funnels" });
    }
  });

  app.post('/api/campaigns/:campaignId/funnels', async (req, res) => {
    try {
      const { campaignId } = req.params;
      const funnelData = insertFunnelSchema.parse({ ...req.body, campaignId });
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

  // Message template routes
  app.get('/api/templates', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const templates = await storage.getMessageTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post('/api/templates', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const templateData = insertMessageTemplateSchema.parse({ ...req.body, userId });
      const template = await storage.createMessageTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.put('/api/templates/:id', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { id } = req.params;
      
      // Verify ownership
      const existingTemplate = await storage.getMessageTemplate(id, userId);
      if (!existingTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }

      const template = await storage.updateMessageTemplate(id, req.body);
      res.json(template);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete('/api/templates/:id', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { id } = req.params;
      
      const success = await storage.deleteMessageTemplate(id, userId);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/dashboard', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      
      // Get basic stats
      const campaigns = await storage.getCampaigns(userId);
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
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
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
