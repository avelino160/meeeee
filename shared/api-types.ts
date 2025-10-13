// API Response Types for React Query

export interface DashboardAnalytics {
  activeFunnels: number;
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