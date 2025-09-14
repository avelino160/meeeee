// API Response Types for React Query

export interface DashboardAnalytics {
  activeCampaigns: number;
  todayMessages: number;
  activeContacts: number;
  totalContacts: number;
  deliveryRate: number;
  sentMessages: number;
  deliveredMessages: number;
  totalMessages: number;
}

export interface WhatsAppStatus {
  connected: boolean;
  phoneNumber?: string;
}

export interface CampaignListResponse {
  filter: (predicate: (campaign: any) => boolean) => any[];
  length: number;
  [index: number]: any;
}

export interface ContactListResponse {
  flatMap: (mapper: (contact: any) => any[]) => any[];
  filter: (predicate: (contact: any) => boolean) => any[];
  [index: number]: any;
}

export interface TemplateListResponse {
  filter: (predicate: (template: any) => boolean) => any[];
}

export interface AnalyticsResponse {
  filter: (predicate: (item: any) => boolean) => any[];
  totalCampaigns: number;
  activeCampaigns: number;
  totalMessages: number;
  todayMessages: number;
  totalContacts: number;
  activeContacts: number;
  deliveryRate?: number;
  deliveredMessages: number;
  sentMessages: number;
  schedulerTasks: any[];
}

// Campaign types for API responses
export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  triggerPhrase: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CampaignsResponse = Campaign[];

// Contact types for API responses
export interface Contact {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ContactsResponse = Contact[];

// Template types for API responses
export interface MessageTemplate {
  id: string;
  name: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';
  content: string;
  mediaUrl?: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export type TemplatesResponse = MessageTemplate[];