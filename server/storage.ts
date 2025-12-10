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
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPlan(userId: string, planType: string, expiresAt: Date): Promise<User | undefined>;
  blockUser(userId: string): Promise<User | undefined>;
  unblockUser(userId: string): Promise<User | undefined>;
  checkPlanExpiration(userId: string): Promise<boolean>;
  
  // WhatsApp connection operations
  getWhatsappConnection(userId: string): Promise<WhatsappConnection | undefined>;
  getConnectedAccountsCount(userId: string): Promise<number>;
  createWhatsappConnection(connection: InsertWhatsappConnection): Promise<WhatsappConnection>;
  updateWhatsappConnection(id: string, updates: Partial<WhatsappConnection>): Promise<WhatsappConnection | undefined>;
  
  // Funnel operations
  getAllFunnels(userId: string): Promise<Funnel[]>;
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
  
  // Funnel execution operations
  getFunnelExecutions(funnelId: string): Promise<FunnelExecution[]>;
  createFunnelExecution(execution: InsertFunnelExecution): Promise<FunnelExecution>;
  updateFunnelExecution(id: string, updates: Partial<FunnelExecution>): Promise<FunnelExecution | undefined>;
  getActiveFunnelExecutions(): Promise<FunnelExecution[]>;
  
  // Plan limit checking operations
  getUserUsage(userId: string): Promise<UsageInfo>;
  checkFunnelLimit(userId: string): Promise<LimitCheckResult>;
  checkContactLimit(userId: string): Promise<LimitCheckResult>;
  checkWhatsappLimit(userId: string): Promise<LimitCheckResult>;
  checkMessageLimit(userId: string): Promise<LimitCheckResult>;
  getMessagesThisHour(userId: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private whatsappConnections: Map<string, WhatsappConnection> = new Map();
  private funnels: Map<string, Funnel> = new Map();
  private funnelNodes: Map<string, FunnelNode> = new Map();
  private contacts: Map<string, Contact> = new Map();
  private messages: Map<string, Message> = new Map();
  private funnelExecutions: Map<string, FunnelExecution> = new Map();
  
  private defaultUserId = "default-user";

  constructor() {
    this.users.set(this.defaultUserId, {
      id: this.defaultUserId,
      email: "user@example.com",
      firstName: "Demo",
      lastName: "User",
      profileImageUrl: null,
      planType: "basic",
      planExpiresAt: null,
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      ...userData,
      createdAt: this.users.get(userData.id)?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  async getWhatsappConnection(userId: string): Promise<WhatsappConnection | undefined> {
    return Array.from(this.whatsappConnections.values()).find(c => c.userId === userId);
  }

  async getConnectedAccountsCount(userId: string): Promise<number> {
    return Array.from(this.whatsappConnections.values())
      .filter(c => c.userId === userId && c.isConnected === true)
      .length;
  }

  async createWhatsappConnection(connection: InsertWhatsappConnection): Promise<WhatsappConnection> {
    const newConnection: WhatsappConnection = {
      id: nanoid(),
      ...connection,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.whatsappConnections.set(newConnection.id, newConnection);
    return newConnection;
  }

  async updateWhatsappConnection(id: string, updates: Partial<WhatsappConnection>): Promise<WhatsappConnection | undefined> {
    const connection = this.whatsappConnections.get(id);
    if (!connection) return undefined;
    const updated = { ...connection, ...updates, updatedAt: new Date() };
    this.whatsappConnections.set(id, updated);
    return updated;
  }

  async getAllFunnels(userId: string): Promise<Funnel[]> {
    return Array.from(this.funnels.values())
      .filter(f => f.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getFunnel(id: string): Promise<Funnel | undefined> {
    return this.funnels.get(id);
  }

  async createFunnel(funnel: InsertFunnel): Promise<Funnel> {
    const newFunnel: Funnel = {
      id: nanoid(),
      ...funnel,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.funnels.set(newFunnel.id, newFunnel);
    return newFunnel;
  }

  async updateFunnel(id: string, updates: Partial<Funnel>): Promise<Funnel | undefined> {
    const funnel = this.funnels.get(id);
    if (!funnel) return undefined;
    const updated = { ...funnel, ...updates, updatedAt: new Date() };
    this.funnels.set(id, updated);
    return updated;
  }

  async deleteFunnel(id: string): Promise<boolean> {
    return this.funnels.delete(id);
  }

  async getFunnelNodes(funnelId: string): Promise<FunnelNode[]> {
    return Array.from(this.funnelNodes.values()).filter(n => n.funnelId === funnelId);
  }

  async createFunnelNode(node: Omit<FunnelNode, "id" | "createdAt">): Promise<FunnelNode> {
    const newNode: FunnelNode = {
      id: nanoid(),
      ...node,
      createdAt: new Date(),
    };
    this.funnelNodes.set(newNode.id, newNode);
    return newNode;
  }

  async updateFunnelNode(id: string, updates: Partial<FunnelNode>): Promise<FunnelNode | undefined> {
    const node = this.funnelNodes.get(id);
    if (!node) return undefined;
    const updated = { ...node, ...updates };
    this.funnelNodes.set(id, updated);
    return updated;
  }

  async deleteFunnelNode(id: string): Promise<boolean> {
    return this.funnelNodes.delete(id);
  }

  async getContacts(userId: string): Promise<Contact[]> {
    return Array.from(this.contacts.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getContact(id: string, userId: string): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    return contact?.userId === userId ? contact : undefined;
  }

  async getContactById(id: string): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getContactByPhone(phoneNumber: string, userId: string): Promise<Contact | undefined> {
    return Array.from(this.contacts.values()).find(
      c => c.phoneNumber === phoneNumber && c.userId === userId
    );
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const newContact: Contact = {
      id: nanoid(),
      ...contact,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.contacts.set(newContact.id, newContact);
    return newContact;
  }

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (!contact) return undefined;
    const updated = { ...contact, ...updates, updatedAt: new Date() };
    this.contacts.set(id, updated);
    return updated;
  }

  async deleteContact(id: string, userId: string): Promise<boolean> {
    const contact = this.contacts.get(id);
    if (!contact || contact.userId !== userId) return false;
    this.contacts.delete(id);
    return true;
  }

  async getMessages(userId: string, limit = 100): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(m => m.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
  }

  async getMessage(id: string, userId: string): Promise<Message | undefined> {
    const message = this.messages.get(id);
    return message?.userId === userId ? message : undefined;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = {
      id: nanoid(),
      ...message,
      createdAt: new Date(),
    };
    this.messages.set(newMessage.id, newMessage);
    return newMessage;
  }

  async updateMessage(id: string, updates: Partial<Message>): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    const updated = { ...message, ...updates };
    this.messages.set(id, updated);
    return updated;
  }

  async getPendingMessages(): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(m => m.status === "pending")
      .sort((a, b) => {
        const timeA = a.scheduledAt?.getTime() || 0;
        const timeB = b.scheduledAt?.getTime() || 0;
        return timeA - timeB;
      });
  }

  async getScheduledMessages(): Promise<Message[]> {
    const now = new Date().getTime();
    return Array.from(this.messages.values()).filter(
      m => m.status === "pending" && m.scheduledAt && m.scheduledAt.getTime() <= now
    );
  }

  async getFunnelExecutions(funnelId: string): Promise<FunnelExecution[]> {
    return Array.from(this.funnelExecutions.values())
      .filter(e => e.funnelId === funnelId)
      .sort((a, b) => b.startedAt!.getTime() - a.startedAt!.getTime());
  }

  async createFunnelExecution(execution: InsertFunnelExecution): Promise<FunnelExecution> {
    const newExecution: FunnelExecution = {
      id: nanoid(),
      ...execution,
      startedAt: new Date(),
      completedAt: null,
    };
    this.funnelExecutions.set(newExecution.id, newExecution);
    return newExecution;
  }

  async updateFunnelExecution(id: string, updates: Partial<FunnelExecution>): Promise<FunnelExecution | undefined> {
    const execution = this.funnelExecutions.get(id);
    if (!execution) return undefined;
    const updated = { ...execution, ...updates };
    this.funnelExecutions.set(id, updated);
    return updated;
  }

  async getActiveFunnelExecutions(): Promise<FunnelExecution[]> {
    return Array.from(this.funnelExecutions.values()).filter(e => e.status === "active");
  }

  async updateUserPlan(userId: string, planType: string, expiresAt: Date): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updated = { 
      ...user, 
      planType: planType as "free" | "basic" | "pro" | "enterprise",
      planExpiresAt: expiresAt,
      isBlocked: false,
      updatedAt: new Date() 
    };
    this.users.set(userId, updated);
    return updated;
  }

  async blockUser(userId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updated = { ...user, isBlocked: true, updatedAt: new Date() };
    this.users.set(userId, updated);
    return updated;
  }

  async unblockUser(userId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updated = { ...user, isBlocked: false, updatedAt: new Date() };
    this.users.set(userId, updated);
    return updated;
  }

  async checkPlanExpiration(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    if (!user.planExpiresAt) return false;
    
    const now = new Date();
    const isExpired = user.planExpiresAt < now;
    
    if (isExpired && !user.isBlocked) {
      await this.blockUser(userId);
    }
    
    return isExpired;
  }

  async getMessagesThisHour(userId: string): Promise<number> {
    const oneHourAgo = new Date();
    oneHourAgo.setTime(oneHourAgo.getTime() - 60 * 60 * 1000);
    
    return Array.from(this.messages.values())
      .filter(m => {
        if (m.userId !== userId) return false;
        if (m.status === 'failed') return false;
        const timestamp = m.sentAt || m.createdAt;
        if (!timestamp) return false;
        return new Date(timestamp) >= oneHourAgo;
      }).length;
  }

  async getUserUsage(userId: string): Promise<UsageInfo> {
    const user = this.users.get(userId);
    const planType = (user?.planType || "basic") as PlanType;
    const limits = getPlanLimits(planType);
    
    const funnelCount = Array.from(this.funnels.values())
      .filter(f => f.userId === userId).length;
    
    const contactCount = Array.from(this.contacts.values())
      .filter(c => c.userId === userId).length;
    
    const whatsappCount = await this.getConnectedAccountsCount(userId);
    const messagesThisHour = await this.getMessagesThisHour(userId);
    
    return {
      whatsappAccounts: {
        current: whatsappCount,
        limit: limits.maxWhatsappAccounts,
        percentage: calculatePercentage(whatsappCount, limits.maxWhatsappAccounts)
      },
      messagesThisHour: {
        current: messagesThisHour,
        limit: limits.maxMessagesPerHour,
        percentage: calculatePercentage(messagesThisHour, limits.maxMessagesPerHour)
      },
      funnels: {
        current: funnelCount,
        limit: limits.maxFunnels,
        percentage: calculatePercentage(funnelCount, limits.maxFunnels)
      },
      contacts: {
        current: contactCount,
        limit: limits.maxContacts,
        percentage: calculatePercentage(contactCount, limits.maxContacts)
      }
    };
  }

  async checkFunnelLimit(userId: string): Promise<LimitCheckResult> {
    const user = this.users.get(userId);
    const planType = (user?.planType || "basic") as PlanType;
    const limits = getPlanLimits(planType);
    
    const funnelCount = Array.from(this.funnels.values())
      .filter(f => f.userId === userId).length;
    
    return checkLimit("funis", funnelCount, limits.maxFunnels);
  }

  async checkContactLimit(userId: string): Promise<LimitCheckResult> {
    const user = this.users.get(userId);
    const planType = (user?.planType || "basic") as PlanType;
    const limits = getPlanLimits(planType);
    
    const contactCount = Array.from(this.contacts.values())
      .filter(c => c.userId === userId).length;
    
    return checkLimit("contatos", contactCount, limits.maxContacts);
  }

  async checkWhatsappLimit(userId: string): Promise<LimitCheckResult> {
    const user = this.users.get(userId);
    const planType = (user?.planType || "basic") as PlanType;
    const limits = getPlanLimits(planType);
    
    const whatsappCount = await this.getConnectedAccountsCount(userId);
    
    return checkLimit("contas WhatsApp", whatsappCount, limits.maxWhatsappAccounts);
  }

  async checkMessageLimit(userId: string): Promise<LimitCheckResult> {
    const user = this.users.get(userId);
    const planType = (user?.planType || "basic") as PlanType;
    const limits = getPlanLimits(planType);
    
    const messagesThisHour = await this.getMessagesThisHour(userId);
    
    return checkLimit("mensagens por hora", messagesThisHour, limits.maxMessagesPerHour);
  }
}

export const storage = new MemStorage();
