import {
  users,
  campaigns,
  funnels,
  funnelNodes,
  contacts,
  messages,
  messageTemplates,
  whatsappConnections,
  funnelExecutions,
  type User,
  type UpsertUser,
  type Campaign,
  type InsertCampaign,
  type Funnel,
  type InsertFunnel,
  type FunnelNode,
  type Contact,
  type InsertContact,
  type Message,
  type InsertMessage,
  type MessageTemplate,
  type InsertMessageTemplate,
  type WhatsappConnection,
  type InsertWhatsappConnection,
  type FunnelExecution,
  type InsertFunnelExecution,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // WhatsApp connection operations
  getWhatsappConnection(userId: string): Promise<WhatsappConnection | undefined>;
  createWhatsappConnection(connection: InsertWhatsappConnection): Promise<WhatsappConnection>;
  updateWhatsappConnection(id: string, updates: Partial<WhatsappConnection>): Promise<WhatsappConnection | undefined>;
  
  // Campaign operations
  getCampaigns(userId: string): Promise<Campaign[]>;
  getCampaign(id: string, userId: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string, userId: string): Promise<boolean>;
  
  // Funnel operations
  getFunnels(campaignId: string): Promise<Funnel[]>;
  getFunnel(id: string): Promise<Funnel | undefined>;
  createFunnel(funnel: InsertFunnel): Promise<Funnel>;
  updateFunnel(id: string, updates: Partial<Funnel>): Promise<Funnel | undefined>;
  deleteFunnel(id: string): Promise<boolean>;
  
  // Funnel node operations
  getFunnelNodes(funnelId: string): Promise<FunnelNode[]>;
  createFunnelNode(node: Omit<FunnelNode, "id" | "createdAt">): Promise<FunnelNode>;
  updateFunnelNode(id: string, updates: Partial<FunnelNode>): Promise<FunnelNode | undefined>;
  deleteFunnelNode(id: string): Promise<boolean>;
  
  // Contact operations
  getContacts(userId: string): Promise<Contact[]>;
  getContact(id: string, userId: string): Promise<Contact | undefined>;
  getContactByPhone(phoneNumber: string, userId: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, updates: Partial<Contact>): Promise<Contact | undefined>;
  deleteContact(id: string, userId: string): Promise<boolean>;
  
  // Message operations
  getMessages(userId: string, limit?: number): Promise<Message[]>;
  getMessage(id: string, userId: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: string, updates: Partial<Message>): Promise<Message | undefined>;
  getPendingMessages(): Promise<Message[]>;
  getScheduledMessages(): Promise<Message[]>;
  
  // Message template operations
  getMessageTemplates(userId: string): Promise<MessageTemplate[]>;
  getMessageTemplate(id: string, userId: string): Promise<MessageTemplate | undefined>;
  createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;
  updateMessageTemplate(id: string, updates: Partial<MessageTemplate>): Promise<MessageTemplate | undefined>;
  deleteMessageTemplate(id: string, userId: string): Promise<boolean>;
  
  // Funnel execution operations
  getFunnelExecutions(funnelId: string): Promise<FunnelExecution[]>;
  createFunnelExecution(execution: InsertFunnelExecution): Promise<FunnelExecution>;
  updateFunnelExecution(id: string, updates: Partial<FunnelExecution>): Promise<FunnelExecution | undefined>;
  getActiveFunnelExecutions(): Promise<FunnelExecution[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // WhatsApp connection operations
  async getWhatsappConnection(userId: string): Promise<WhatsappConnection | undefined> {
    const [connection] = await db
      .select()
      .from(whatsappConnections)
      .where(eq(whatsappConnections.userId, userId));
    return connection;
  }

  async createWhatsappConnection(connection: InsertWhatsappConnection): Promise<WhatsappConnection> {
    const [newConnection] = await db
      .insert(whatsappConnections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async updateWhatsappConnection(id: string, updates: Partial<WhatsappConnection>): Promise<WhatsappConnection | undefined> {
    const [connection] = await db
      .update(whatsappConnections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(whatsappConnections.id, id))
      .returning();
    return connection;
  }

  // Campaign operations
  async getCampaigns(userId: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: string, userId: string): Promise<Campaign | undefined> {
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
    return campaign;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db
      .insert(campaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined> {
    const [campaign] = await db
      .update(campaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign;
  }

  async deleteCampaign(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Funnel operations
  async getFunnels(campaignId: string): Promise<Funnel[]> {
    return await db
      .select()
      .from(funnels)
      .where(eq(funnels.campaignId, campaignId))
      .orderBy(desc(funnels.createdAt));
  }

  async getFunnel(id: string): Promise<Funnel | undefined> {
    const [funnel] = await db
      .select()
      .from(funnels)
      .where(eq(funnels.id, id));
    return funnel;
  }

  async createFunnel(funnel: InsertFunnel): Promise<Funnel> {
    const [newFunnel] = await db
      .insert(funnels)
      .values(funnel)
      .returning();
    return newFunnel;
  }

  async updateFunnel(id: string, updates: Partial<Funnel>): Promise<Funnel | undefined> {
    const [funnel] = await db
      .update(funnels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(funnels.id, id))
      .returning();
    return funnel;
  }

  async deleteFunnel(id: string): Promise<boolean> {
    const result = await db
      .delete(funnels)
      .where(eq(funnels.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Funnel node operations
  async getFunnelNodes(funnelId: string): Promise<FunnelNode[]> {
    return await db
      .select()
      .from(funnelNodes)
      .where(eq(funnelNodes.funnelId, funnelId));
  }

  async createFunnelNode(node: Omit<FunnelNode, "id" | "createdAt">): Promise<FunnelNode> {
    const [newNode] = await db
      .insert(funnelNodes)
      .values(node)
      .returning();
    return newNode;
  }

  async updateFunnelNode(id: string, updates: Partial<FunnelNode>): Promise<FunnelNode | undefined> {
    const [node] = await db
      .update(funnelNodes)
      .set(updates)
      .where(eq(funnelNodes.id, id))
      .returning();
    return node;
  }

  async deleteFunnelNode(id: string): Promise<boolean> {
    const result = await db
      .delete(funnelNodes)
      .where(eq(funnelNodes.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Contact operations
  async getContacts(userId: string): Promise<Contact[]> {
    return await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(desc(contacts.createdAt));
  }

  async getContact(id: string, userId: string): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
    return contact;
  }

  // Internal method for service use - gets contact by ID without userId restriction
  async getContactById(id: string): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, id));
    return contact;
  }

  async getContactByPhone(phoneNumber: string, userId: string): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.phoneNumber, phoneNumber), eq(contacts.userId, userId)));
    return contact;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db
      .insert(contacts)
      .values(contact)
      .returning();
    return newContact;
  }

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact | undefined> {
    const [contact] = await db
      .update(contacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return contact;
  }

  async deleteContact(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Message operations
  async getMessages(userId: string, limit = 100): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  async getMessage(id: string, userId: string): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(and(eq(messages.id, id), eq(messages.userId, userId)));
    return message;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async updateMessage(id: string, updates: Partial<Message>): Promise<Message | undefined> {
    const [message] = await db
      .update(messages)
      .set(updates)
      .where(eq(messages.id, id))
      .returning();
    return message;
  }

  async getPendingMessages(): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.status, "pending"))
      .orderBy(asc(messages.scheduledAt));
  }

  async getScheduledMessages(): Promise<Message[]> {
    const now = new Date();
    return await db
      .select()
      .from(messages)
      .where(and(
        eq(messages.status, "pending"),
        eq(messages.scheduledAt, now)
      ));
  }

  // Message template operations
  async getMessageTemplates(userId: string): Promise<MessageTemplate[]> {
    return await db
      .select()
      .from(messageTemplates)
      .where(eq(messageTemplates.userId, userId))
      .orderBy(desc(messageTemplates.createdAt));
  }

  async getMessageTemplate(id: string, userId: string): Promise<MessageTemplate | undefined> {
    const [template] = await db
      .select()
      .from(messageTemplates)
      .where(and(eq(messageTemplates.id, id), eq(messageTemplates.userId, userId)));
    return template;
  }

  async createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate> {
    const [newTemplate] = await db
      .insert(messageTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateMessageTemplate(id: string, updates: Partial<MessageTemplate>): Promise<MessageTemplate | undefined> {
    const [template] = await db
      .update(messageTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(messageTemplates.id, id))
      .returning();
    return template;
  }

  async deleteMessageTemplate(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(messageTemplates)
      .where(and(eq(messageTemplates.id, id), eq(messageTemplates.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Funnel execution operations
  async getFunnelExecutions(funnelId: string): Promise<FunnelExecution[]> {
    return await db
      .select()
      .from(funnelExecutions)
      .where(eq(funnelExecutions.funnelId, funnelId))
      .orderBy(desc(funnelExecutions.startedAt));
  }

  async createFunnelExecution(execution: InsertFunnelExecution): Promise<FunnelExecution> {
    const [newExecution] = await db
      .insert(funnelExecutions)
      .values(execution)
      .returning();
    return newExecution;
  }

  async updateFunnelExecution(id: string, updates: Partial<FunnelExecution>): Promise<FunnelExecution | undefined> {
    const [execution] = await db
      .update(funnelExecutions)
      .set(updates)
      .where(eq(funnelExecutions.id, id))
      .returning();
    return execution;
  }

  async getActiveFunnelExecutions(): Promise<FunnelExecution[]> {
    return await db
      .select()
      .from(funnelExecutions)
      .where(eq(funnelExecutions.status, "active"));
  }
}

export const storage = new DatabaseStorage();
