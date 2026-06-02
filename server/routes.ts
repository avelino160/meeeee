import type { Express } from "express";
import { createServer, type Server } from "http";
import { randomUUID } from "crypto";
import axios from "axios";
import { storage } from "./storage";
import { whatsappService } from "./services/whatsappService";
import { baileyService } from "./services/baileyService";
import { funnelService } from "./services/funnelService";
import { schedulerService } from "./services/schedulerService";
import { 
  insertFunnelSchema,
  insertContactSchema,
  insertMessageSchema,
} from "@shared/schema";
import { z } from "zod";
import { readFileSync } from "fs";
import { join } from "path";
import { validateFunnelJSON, funnelJSONSchema } from "@shared/funnel-json-types";
import { convertFunnelJSONToFlowData } from "./services/funnelJsonConverter";

const DEFAULT_USER_ID = "default-user";
const DEMO_USER = {
  id: DEFAULT_USER_ID,
  firstName: "Usuário",
  lastName: "Demo",
  email: "demo@pilotzap.com",
};


export async function registerRoutes(app: Express): Promise<Server> {
  // Funnel JSON route
  app.get('/api/funnel-json', async (req, res) => {
    try {
      const filePath = join(process.cwd(), 'attached_assets', '[P.O] - Receitas sem Glúten_1760773130289.json');
      const fileContent = readFileSync(filePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      res.json(jsonData);
    } catch (error) {
      console.error("Error reading funnel JSON:", error);
      res.status(500).json({ message: "Failed to read funnel JSON" });
    }
  });

  // User routes
  app.get('/api/user/me', async (req, res) => {
    try {
      const user = await storage.getUser(DEFAULT_USER_ID);
      
      if (!user) {
        // Create demo user if doesn't exist
        await storage.upsertUser({
          ...DEMO_USER,
          planType: 'enterprise',
          isBlocked: false
        });
        res.json({ ...DEMO_USER, planType: 'enterprise', isBlocked: false });
        return;
      }

      await storage.checkPlanExpiration(DEFAULT_USER_ID);
      const updatedUser = await storage.getUser(DEFAULT_USER_ID);

      res.json({
        id: updatedUser?.id || DEMO_USER.id,
        firstName: updatedUser?.firstName || DEMO_USER.firstName,
        lastName: updatedUser?.lastName || DEMO_USER.lastName,
        email: updatedUser?.email || DEMO_USER.email,
        planType: updatedUser?.planType || 'enterprise',
        planExpiresAt: updatedUser?.planExpiresAt || null,
        isBlocked: updatedUser?.isBlocked || false
      });
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

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

  app.get('/api/whatsapp/connected-count', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const count = await storage.getConnectedAccountsCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error getting connected accounts count:", error);
      res.status(500).json({ message: "Failed to get connected accounts count" });
    }
  });

  // 🛡️ Anti-ban stats endpoint
  app.get('/api/whatsapp/anti-ban-stats', async (req, res) => {
    try {
      const stats = await whatsappService.getAntiBanStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting anti-ban stats:", error);
      res.status(500).json({ message: "Failed to get anti-ban stats" });
    }
  });

  // 📱 Listar todas as conexões WhatsApp do usuário
  app.get('/api/whatsapp/connections', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const connections = await storage.getAllWhatsappConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error("Error getting WhatsApp connections:", error);
      res.status(500).json({ message: "Failed to get WhatsApp connections" });
    }
  });

  // ✏️ Atualizar nome da conexão WhatsApp
  app.patch('/api/whatsapp/connections/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const updateData: any = {};
      if (name) updateData.name = name.trim();
      const updated = await storage.updateWhatsappConnection(id, updateData);
      if (!updated) {
        return res.status(404).json({ message: "Connection not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating WhatsApp connection:", error);
      res.status(500).json({ message: "Failed to update WhatsApp connection" });
    }
  });

  // 🗑️ Deletar conexão WhatsApp
  app.delete('/api/whatsapp/connections/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteWhatsappConnection(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting WhatsApp connection:", error);
      res.status(500).json({ message: "Failed to delete WhatsApp connection" });
    }
  });

  // 🐝 Baileys: start a new WhatsApp session (returns sessionId)
  app.post('/api/whatsapp/start-session', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;

      const limitCheck = await storage.checkWhatsappLimit(userId);
      if (!limitCheck.allowed) {
        return res.status(403).json({
          message: limitCheck.reason,
          error: "limit_exceeded",
          limit: limitCheck.limit,
          current: limitCheck.current
        });
      }

      const sessionId = randomUUID();
      // Start async — do not await so the client gets the sessionId immediately
      baileyService.startSession(sessionId, userId);

      res.json({ sessionId });
    } catch (error: any) {
      console.error("Error starting Baileys session:", error);
      res.status(500).json({ message: "Failed to start WhatsApp session" });
    }
  });

  // 🐝 Baileys: poll session status / QR code
  app.get('/api/whatsapp/session-status/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const session = baileyService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ status: "not_found" });
    }
    res.json({
      status: session.status,
      qrCode: session.qrCodeBase64,
      phoneNumber: session.phoneNumber,
      connectionId: session.connectionId,
      error: session.error,
    });
  });

  // 🐝 Baileys: terminate / cancel a session
  app.delete('/api/whatsapp/session/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const session = baileyService.getSession(sessionId);
    // If session has a DB connectionId, mark it disconnected
    if (session?.connectionId) {
      await storage.updateWhatsappConnection(session.connectionId, { isConnected: false }).catch(() => {});
    }
    await baileyService.terminateSession(sessionId);
    res.json({ success: true });
  });

  // Legacy QR endpoint — kept for compatibility, now delegates to Baileys start-session
  app.post('/api/whatsapp/qr', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const sessionId = randomUUID();
      baileyService.startSession(sessionId, userId);
      // Wait a moment for the QR to generate
      await new Promise(r => setTimeout(r, 8000));
      const session = baileyService.getSession(sessionId);
      if (session?.qrCodeBase64) {
        return res.json({ qrCode: session.qrCodeBase64, sessionId });
      }
      res.status(503).json({ message: "QR Code ainda não disponível. Use /api/whatsapp/start-session e poll /api/whatsapp/session-status/:sessionId" });
    } catch (error: any) {
      res.status(500).json({ message: error?.message || "Falha ao gerar QR Code" });
    }
  });

  // pairing-code não suportado com Baileys direto — retorna mensagem informativa
  app.post('/api/whatsapp/pairing-code', async (_req, res) => {
    res.status(400).json({ message: "Use o QR Code para conectar. Pairing code não suportado." });
  });

  app.post('/api/whatsapp/connect', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const limitCheck = await storage.checkWhatsappLimit(userId);
      if (!limitCheck.allowed) {
        return res.status(403).json({ 
          message: limitCheck.reason,
          error: "limit_exceeded",
          limit: limitCheck.limit,
          current: limitCheck.current
        });
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
      const userId = DEFAULT_USER_ID;
      const connections = await storage.getAllWhatsappConnections(userId);
      for (const conn of connections) {
        await storage.updateWhatsappConnection(conn.id, { isConnected: false });
        await baileyService.terminateSession(conn.id);
      }
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

  app.get('/api/funnels/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const funnel = await storage.getFunnel(id);
      if (!funnel) {
        return res.status(404).json({ message: "Funnel not found" });
      }
      res.json(funnel);
    } catch (error) {
      console.error("Error fetching funnel:", error);
      res.status(500).json({ message: "Failed to fetch funnel" });
    }
  });

  app.post('/api/funnels', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      
      const limitCheck = await storage.checkFunnelLimit(userId);
      if (!limitCheck.allowed) {
        return res.status(403).json({ 
          message: limitCheck.reason,
          error: "limit_exceeded",
          limit: limitCheck.limit,
          current: limitCheck.current
        });
      }
      
      const funnelData = insertFunnelSchema.parse({ ...req.body, userId });
      const funnel = await storage.createFunnel(funnelData);
      res.status(201).json(funnel);
    } catch (error) {
      console.error("Error creating funnel:", error);
      res.status(500).json({ message: "Failed to create funnel" });
    }
  });

  app.post('/api/funnels/import', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { funnels } = req.body;

      if (!Array.isArray(funnels)) {
        return res.status(400).json({ message: "Funnels must be an array" });
      }

      const user = await storage.getUser(userId);
      const planType = user?.planType || 'basic';
      const { getPlanLimits } = await import('@shared/plan-limits');
      const limits = getPlanLimits(planType as any);
      const currentFunnels = await storage.getAllFunnels(userId);
      
      if (limits.maxFunnels !== -1) {
        const availableSlots = limits.maxFunnels - currentFunnels.length;
        if (availableSlots <= 0) {
          return res.status(403).json({ 
            message: `Limite de funis atingido. Seu plano permite apenas ${limits.maxFunnels} funis.`,
            error: "limit_exceeded",
            limit: limits.maxFunnels,
            current: currentFunnels.length
          });
        }
        if (funnels.length > availableSlots) {
          return res.status(403).json({ 
            message: `Você só pode importar ${availableSlots} funis. Tentando importar ${funnels.length}.`,
            error: "limit_exceeded",
            limit: limits.maxFunnels,
            current: currentFunnels.length,
            available: availableSlots
          });
        }
      }

      const importedFunnels = [];
      const errors: string[] = [];

      for (const funnelData of funnels) {
        try {
          let flowData;
          let funnelName;
          let triggerPhrases: string[] = [];

          const isFunnelJSON = funnelData.funnel_name && funnelData.settings && funnelData.nodes;

          if (isFunnelJSON) {
            const validation = validateFunnelJSON(funnelData);
            
            if (!validation.valid) {
              errors.push(`Erro na validação do funil "${funnelData.funnel_name}": ${validation.errors.join(', ')}`);
              continue;
            }

            const parsedJSON = funnelJSONSchema.parse(funnelData);
            flowData = convertFunnelJSONToFlowData(parsedJSON);
            funnelName = parsedJSON.funnel_name;
            
            if (parsedJSON.meta?.tags) {
              triggerPhrases = parsedJSON.meta.tags;
            }
          } else {
            funnelName = funnelData.name || 'Funil Importado';
            triggerPhrases = funnelData.triggerPhrases || [];
            flowData = funnelData.flowData || { nodes: [], edges: [] };
          }

          const validatedData = insertFunnelSchema.parse({ 
            name: funnelName,
            userId,
            status: funnelData.status || 'draft',
            triggerPhrases,
            flowData
          });

          const funnel = await storage.createFunnel(validatedData);
          importedFunnels.push(funnel);
        } catch (error: any) {
          console.error("Error importing funnel:", error);
          errors.push(`Erro ao importar funil: ${error.message}`);
        }
      }

      res.status(201).json({ 
        success: true, 
        imported: importedFunnels.length,
        total: funnels.length,
        funnels: importedFunnels,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error importing funnels:", error);
      res.status(500).json({ message: "Failed to import funnels" });
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
      
      const limitCheck = await storage.checkContactLimit(userId);
      if (!limitCheck.allowed) {
        return res.status(403).json({ 
          message: limitCheck.reason,
          error: "limit_exceeded",
          limit: limitCheck.limit,
          current: limitCheck.current
        });
      }
      
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

  app.post('/api/contacts/import', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { contacts } = req.body;

      if (!contacts || !Array.isArray(contacts)) {
        return res.status(400).json({ message: "Invalid contacts data" });
      }

      let imported = 0;
      for (const contactData of contacts) {
        try {
          const limitCheck = await storage.checkContactLimit(userId);
          if (!limitCheck.allowed) {
            break;
          }
          
          const contact = await storage.createContact({
            userId,
            phoneNumber: contactData.phoneNumber,
            name: contactData.name || null,
            email: contactData.email || null,
            tags: contactData.tags || [],
            isActive: contactData.isActive !== undefined ? contactData.isActive : true,
          });
          if (contact) imported++;
        } catch (err) {
          console.error("Error importing contact:", err);
        }
      }

      res.json({ imported, total: contacts.length });
    } catch (error) {
      console.error("Error importing contacts:", error);
      res.status(500).json({ message: "Failed to import contacts" });
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

      const limitCheck = await storage.checkMessageLimit(userId);
      if (!limitCheck.allowed) {
        return res.status(403).json({ 
          message: limitCheck.reason,
          error: "limit_exceeded",
          limit: limitCheck.limit,
          current: limitCheck.current
        });
      }

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

  // User usage/limits endpoint
  app.get('/api/user/usage', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      const usage = await storage.getUserUsage(userId);
      const user = await storage.getUser(userId);
      
      res.json({
        planType: user?.planType || 'basic',
        usage
      });
    } catch (error) {
      console.error("Error fetching user usage:", error);
      res.status(500).json({ message: "Failed to fetch user usage" });
    }
  });

  // Plan management routes
  app.get('/api/user/plan-status', async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;
      
      const isExpired = await storage.checkPlanExpiration(userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        planType: user.planType,
        planExpiresAt: user.planExpiresAt,
        isBlocked: user.isBlocked,
        isExpired
      });
    } catch (error) {
      console.error("Error checking plan status:", error);
      res.status(500).json({ message: "Failed to check plan status" });
    }
  });

  const ADMIN_SECRET = process.env.ADMIN_SECRET || 'pilotzap-admin-2024';
  
  const verifyAdminAuth = (req: any, res: any): boolean => {
    const authHeader = req.headers['x-admin-secret'];
    if (authHeader !== ADMIN_SECRET) {
      res.status(403).json({ message: "Unauthorized: Invalid admin credentials" });
      return false;
    }
    return true;
  };

  app.post('/api/admin/activate-plan', async (req, res) => {
    if (!verifyAdminAuth(req, res)) return;
    
    try {
      const { userId, planType, durationDays } = req.body;
      
      if (!userId || !planType || !durationDays) {
        return res.status(400).json({ message: "userId, planType, and durationDays are required" });
      }

      const validPlans = ['basic', 'pro', 'enterprise'];
      if (!validPlans.includes(planType)) {
        return res.status(400).json({ message: "Invalid plan type" });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays));

      const user = await storage.updateUserPlan(userId, planType, expiresAt);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          planType: user.planType,
          planExpiresAt: user.planExpiresAt,
          isBlocked: user.isBlocked
        }
      });
    } catch (error) {
      console.error("Error activating plan:", error);
      res.status(500).json({ message: "Failed to activate plan" });
    }
  });

  app.post('/api/admin/block-user', async (req, res) => {
    if (!verifyAdminAuth(req, res)) return;
    
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      const user = await storage.blockUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ success: true, isBlocked: user.isBlocked });
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ message: "Failed to block user" });
    }
  });

  app.post('/api/admin/unblock-user', async (req, res) => {
    if (!verifyAdminAuth(req, res)) return;
    
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      const user = await storage.unblockUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ success: true, isBlocked: user.isBlocked });
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ message: "Failed to unblock user" });
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
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayMessages = messages.filter(m => 
        m.createdAt && new Date(m.createdAt) >= today
      );
      
      const yesterdayMessages = messages.filter(m => {
        if (!m.createdAt) return false;
        const msgDate = new Date(m.createdAt);
        return msgDate >= yesterday && msgDate < today;
      });
      
      const sentMessages = messages.filter(m => m.status === 'sent');
      const deliveredMessages = messages.filter(m => m.status === 'delivered');
      
      const yesterdaySentMessages = yesterdayMessages.filter(m => m.status === 'sent');
      const yesterdayDeliveredMessages = yesterdayMessages.filter(m => m.status === 'delivered');
      const yesterdayDeliveryRate = yesterdaySentMessages.length > 0 
        ? (yesterdayDeliveredMessages.length / yesterdaySentMessages.length) * 100 
        : 0;
      
      // Calculate weekly data for chart
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const weeklyData = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const dayMessages = messages.filter(m => {
          if (!m.createdAt) return false;
          const msgDate = new Date(m.createdAt);
          return msgDate >= date && msgDate < nextDate;
        });
        
        const dayContacts = contacts.filter(c => {
          if (!c.createdAt) return false;
          const contactDate = new Date(c.createdAt);
          return contactDate >= date && contactDate < nextDate;
        });
        
        weeklyData.push({
          name: dayNames[date.getDay()],
          mensagens: dayMessages.length,
          contatos: dayContacts.length,
          conversoes: dayMessages.filter(m => m.status === 'delivered').length,
        });
      }
      
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
        weeklyData,
        // Comparison data (yesterday)
        yesterdayMessages: yesterdayMessages.length,
        yesterdayDeliveryRate,
        yesterdaySentMessages: yesterdaySentMessages.length,
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
