// API Response Types for React Query

export interface WeeklyDataPoint {
  name: string;
  mensagens: number;
  contatos: number;
  conversoes: number;
}

export interface DashboardAnalytics {
  totalFunnels: number;
  activeFunnels: number;
  todayMessages: number;
  activeContacts: number;
  totalContacts: number;
  deliveryRate: number;
  sentMessages: number;
  deliveredMessages: number;
  totalMessages: number;
  weeklyData?: WeeklyDataPoint[];
  // Comparison data
  yesterdayMessages: number;
  yesterdayDeliveryRate: number;
  yesterdaySentMessages: number;
}

export interface WhatsAppStatus {
  connected: boolean;
  phoneNumber?: string;
}

export interface ContactListResponse {
  flatMap: (mapper: (contact: any) => any[]) => any[];
  filter: (predicate: (contact: any) => boolean) => any[];
  [index: number]: any;
}

export interface AnalyticsResponse {
  filter: (predicate: (item: any) => boolean) => any[];
  totalFunnels: number;
  activeFunnels: number;
  totalMessages: number;
  todayMessages: number;
  totalContacts: number;
  activeContacts: number;
  deliveryRate?: number;
  deliveredMessages: number;
  sentMessages: number;
  schedulerTasks: any[];
}

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

// Campaign types for API responses
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'inactive' | 'draft';
  triggerPhrase: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CampaignsResponse = Campaign[];