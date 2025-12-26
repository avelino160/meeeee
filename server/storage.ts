import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  type User,
  type UpsertUser,
  type Funnel,
  type InsertFunnel,
  type FunnelNode,
  type Contact,
  type InsertContact,
  type Message,
  type InsertMessage,
  type WhatsappConnection,
  type InsertWhatsappConnection,
  type FunnelExecution,
  type InsertFunnelExecution,
  users,
  whatsappConnections,
  funnels,
  funnelNodes,
  contacts,
  messages,
  funnelExecutions,
} from "@shared/schema";
import { nanoid } from "nanoid";
import { 
  getPlanLimits, 
  checkLimit, 
  calculatePercentage,
  type PlanType,
  type UsageInfo,
  type LimitCheckResult 
} from "@shared/plan-limits";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPlan(userId: string, planType: string, expiresAt: Date): Promise<User | undefined>;
  blockUser(userId: string): Promise<User | undefined>;
  unblockUser(userId: string): Promise<User | undefined>;
  checkPlanExpiration(userId: string): Promise<boolean>;
  getWhatsappConnection(userId: string): Promise<WhatsappConnection | undefined>;
  getAllWhatsappConnections(userId: string): Promise<WhatsappConnection[]>;
  getConnectedAccountsCount(userId: string): Promise<number>;
  createWhatsappConnection(connection: InsertWhatsappConnection): Promise<WhatsappConnection>;
  updateWhatsappConnection(id: string, updates: Partial<WhatsappConnection>): Promise<WhatsappConnection | undefined>;
  getAllFunnels(userId: string): Promise<Funnel[]>;
  getFunnel(id: string): Promise<Funnel | undefined>;
  createFunnel(funnel: InsertFunnel): Promise<Funnel>;
  updateFunnel(id: string, updates: Partial<Funnel>): Promise<Funnel | undefined>;
  deleteFunnel(id: string): Promise<boolean>;
  getFunnelNodes(funnelId: string): Promise<FunnelNode[]>;
  createFunnelNode(node: Omit<FunnelNode, "id" | "createdAt">): Promise<FunnelNode>;
  updateFunnelNode(id: string, updates: Partial<FunnelNode>): Promise<FunnelNode | undefined>;
  deleteFunnelNode(id: string): Promise<boolean>;
  getContacts(userId: string): Promise<Contact[]>;
  getContact(id: string, userId: string): Promise<Contact | undefined>;
  getContactByPhone(phoneNumber: string, userId: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, updates: Partial<Contact>): Promise<Contact | undefined>;
  deleteContact(id: string, userId: string): Promise<boolean>;
  getMessages(userId: string, limit?: number): Promise<Message[]>;
  getMessage(id: string, userId: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: string, updates: Partial<Message>): Promise<Message | undefined>;
  getPendingMessages(): Promise<Message[]>;
  getScheduledMessages(): Promise<Message[]>;
  getFunnelExecutions(funnelId: string): Promise<FunnelExecution[]>;
  createFunnelExecution(execution: InsertFunnelExecution): Promise<FunnelExecution>;
  updateFunnelExecution(id: string, updates: Partial<FunnelExecution>): Promise<FunnelExecution | undefined>;
  getActiveFunnelExecutions(): Promise<FunnelExecution[]>;
  getUserUsage(userId: string): Promise<UsageInfo>;
  checkFunnelLimit(userId: string): Promise<LimitCheckResult>;
  checkContactLimit(userId: string): Promise<LimitCheckResult>;
  checkWhatsappLimit(userId: string): Promise<LimitCheckResult>;
  checkMessageLimit(userId: string): Promise<LimitCheckResult>;
  getMessagesThisHour(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: { ...userData, updatedAt: new Date() }
    }).returning();
    return user;
  }

  async getWhatsappConnection(userId: string): Promise<WhatsappConnection | undefined> {
    const [conn] = await db.select().from(whatsappConnections).where(eq(whatsappConnections.userId, userId));
    return conn;
  }

  async getAllWhatsappConnections(userId: string): Promise<WhatsappConnection[]> {
    return await db.select().from(whatsappConnections)
      .where(eq(whatsappConnections.userId, userId))
      .orderBy(desc(whatsappConnections.createdAt));
  }

  async getConnectedAccountsCount(userId: string): Promise<number> {
    const conns = await db.select().from(whatsappConnections)
      .where(and(eq(whatsappConnections.userId, userId), eq(whatsappConnections.isConnected, true)));
    return conns.length;
  }

  async createWhatsappConnection(conn: InsertWhatsappConnection): Promise<WhatsappConnection> {
    const [newConn] = await db.insert(whatsappConnections).values(conn).returning();
    return newConn;
  }

  async updateWhatsappConnection(id: string, update: Partial<WhatsappConnection>): Promise<WhatsappConnection | undefined> {
    const [updated] = await db.update(whatsappConnections)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(whatsappConnections.id, id))
      .returning();
    return updated;
  }

  async getAllFunnels(userId: string): Promise<Funnel[]> {
    return await db.select().from(funnels).where(eq(funnels.userId, userId)).orderBy(desc(funnels.createdAt));
  }

  async getFunnel(id: string): Promise<Funnel | undefined> {
    const [funnel] = await db.select().from(funnels).where(eq(funnels.id, id));
    return funnel;
  }

  async createFunnel(funnel: InsertFunnel): Promise<Funnel> {
    const [newFunnel] = await db.insert(funnels).values(funnel).returning();
    return newFunnel;
  }

  async updateFunnel(id: string, updates: Partial<Funnel>): Promise<Funnel | undefined> {
    const [updated] = await db.update(funnels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(funnels.id, id))
      .returning();
    return updated;
  }

  async deleteFunnel(id: string): Promise<boolean> {
    const [deleted] = await db.delete(funnels).where(eq(funnels.id, id)).returning();
    return !!deleted;
  }

  async getFunnelNodes(funnelId: string): Promise<FunnelNode[]> {
    return await db.select().from(funnelNodes).where(eq(funnelNodes.funnelId, funnelId));
  }

  async createFunnelNode(node: Omit<FunnelNode, "id" | "createdAt">): Promise<FunnelNode> {
    const [newNode] = await db.insert(funnelNodes).values(node).returning();
    return newNode;
  }

  async updateFunnelNode(id: string, updates: Partial<FunnelNode>): Promise<FunnelNode | undefined> {
    const [updated] = await db.update(funnelNodes)
      .set(updates)
      .where(eq(funnelNodes.id, id))
      .returning();
    return updated;
  }

  async deleteFunnelNode(id: string): Promise<boolean> {
    const [deleted] = await db.delete(funnelNodes).where(eq(funnelNodes.id, id)).returning();
    return !!deleted;
  }

  async getContacts(userId: string): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.userId, userId)).orderBy(desc(contacts.createdAt));
  }

  async getContact(id: string, userId: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
    return contact;
  }

  async getContactByPhone(phoneNumber: string, userId: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(and(eq(contacts.phoneNumber, phoneNumber), eq(contacts.userId, userId)));
    return contact;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact | undefined> {
    const [updated] = await db.update(contacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return updated;
  }

  async deleteContact(id: string, userId: string): Promise<boolean> {
    const [deleted] = await db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId))).returning();
    return !!deleted;
  }

  async getMessages(userId: string, limit = 100): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.userId, userId)).orderBy(desc(messages.createdAt)).limit(limit);
  }

  async getMessage(id: string, userId: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(and(eq(messages.id, id), eq(messages.userId, userId)));
    return message;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async updateMessage(id: string, updates: Partial<Message>): Promise<Message | undefined> {
    const [updated] = await db.update(messages)
      .set(updates)
      .where(eq(messages.id, id))
      .returning();
    return updated;
  }

  async getPendingMessages(): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.status, "pending")).orderBy(messages.scheduledAt);
  }

  async getScheduledMessages(): Promise<Message[]> {
    return await db.select().from(messages).where(and(eq(messages.status, "pending"), sql`scheduled_at <= now()`));
  }

  async getFunnelExecutions(funnelId: string): Promise<FunnelExecution[]> {
    return await db.select().from(funnelExecutions).where(eq(funnelExecutions.funnelId, funnelId)).orderBy(desc(funnelExecutions.startedAt));
  }

  async createFunnelExecution(execution: InsertFunnelExecution): Promise<FunnelExecution> {
    const [newExecution] = await db.insert(funnelExecutions).values(execution).returning();
    return newExecution;
  }

  async updateFunnelExecution(id: string, updates: Partial<FunnelExecution>): Promise<FunnelExecution | undefined> {
    const [updated] = await db.update(funnelExecutions)
      .set(updates)
      .where(eq(funnelExecutions.id, id))
      .returning();
    return updated;
  }

  async getActiveFunnelExecutions(): Promise<FunnelExecution[]> {
    return await db.select().from(funnelExecutions).where(eq(funnelExecutions.status, "active"));
  }

  async updateUserPlan(userId: string, planType: string, expiresAt: Date): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ planType: planType as any, planExpiresAt: expiresAt, isBlocked: false, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async blockUser(userId: string): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ isBlocked: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async unblockUser(userId: string): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ isBlocked: false, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async checkPlanExpiration(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.planExpiresAt) return false;
    const isExpired = user.planExpiresAt < new Date();
    if (isExpired && !user.isBlocked) await this.blockUser(userId);
    return isExpired;
  }

  async getMessagesThisHour(userId: string): Promise<number> {
    const result = await db.select().from(messages)
      .where(and(eq(messages.userId, userId), sql`status != 'failed'`, sql`coalesce(sent_at, created_at) >= now() - interval '1 hour'`));
    return result.length;
  }

  async getUserUsage(userId: string): Promise<UsageInfo> {
    const user = await this.getUser(userId);
    const planType = (user?.planType || "basic") as PlanType;
    const limits = getPlanLimits(planType);
    const funnelCount = (await this.getAllFunnels(userId)).length;
    const contactCount = (await this.getContacts(userId)).length;
    const whatsappCount = await this.getConnectedAccountsCount(userId);
    const messagesThisHour = await this.getMessagesThisHour(userId);
    return {
      whatsappAccounts: { current: whatsappCount, limit: limits.maxWhatsappAccounts, percentage: calculatePercentage(whatsappCount, limits.maxWhatsappAccounts) },
      messagesThisHour: { current: messagesThisHour, limit: limits.maxMessagesPerHour, percentage: calculatePercentage(messagesThisHour, limits.maxMessagesPerHour) },
      funnels: { current: funnelCount, limit: limits.maxFunnels, percentage: calculatePercentage(funnelCount, limits.maxFunnels) },
      contacts: { current: contactCount, limit: limits.maxContacts, percentage: calculatePercentage(contactCount, limits.maxContacts) }
    };
  }

  async checkFunnelLimit(userId: string): Promise<LimitCheckResult> {
    const user = await this.getUser(userId);
    const planType = (user?.planType || "basic") as PlanType;
    const limits = getPlanLimits(planType);
    const count = (await this.getAllFunnels(userId)).length;
    return checkLimit("funis", count, limits.maxFunnels);
  }

  async checkContactLimit(userId: string): Promise<LimitCheckResult> {
    const user = await this.getUser(userId);
    const planType = (user?.planType || "basic") as PlanType;
    const limits = getPlanLimits(planType);
    const count = (await this.getContacts(userId)).length;
    return checkLimit("contatos", count, limits.maxContacts);
  }

  async checkWhatsappLimit(userId: string): Promise<LimitCheckResult> {
    const user = await this.getUser(userId);
    const planType = (user?.planType || "basic") as PlanType;
    const limits = getPlanLimits(planType);
    const count = await this.getConnectedAccountsCount(userId);
    return checkLimit("contas WhatsApp", count, limits.maxWhatsappAccounts);
  }

  async checkMessageLimit(userId: string): Promise<LimitCheckResult> {
    const user = await this.getUser(userId);
    const planType = (user?.planType || "basic") as PlanType;
    const limits = getPlanLimits(planType);
    const count = await this.getMessagesThisHour(userId);
    return checkLimit("mensagens por hora", count, limits.maxMessagesPerHour);
  }
}

export const storage = new DatabaseStorage();