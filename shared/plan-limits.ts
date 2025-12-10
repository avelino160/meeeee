export type PlanType = "free" | "basic" | "pro" | "enterprise";

export interface PlanLimits {
  maxWhatsappAccounts: number;
  maxMessagesPerHour: number;
  maxFunnels: number;
  maxContacts: number;
  hasAdvancedReports: boolean;
  hasPrioritySupport: boolean;
  hasDedicatedManager: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxWhatsappAccounts: 1,
    maxMessagesPerHour: 50,
    maxFunnels: 3,
    maxContacts: 500,
    hasAdvancedReports: false,
    hasPrioritySupport: false,
    hasDedicatedManager: false,
  },
  basic: {
    maxWhatsappAccounts: 2,
    maxMessagesPerHour: 100,
    maxFunnels: 10,
    maxContacts: 2000,
    hasAdvancedReports: false,
    hasPrioritySupport: false,
    hasDedicatedManager: false,
  },
  pro: {
    maxWhatsappAccounts: 3,
    maxMessagesPerHour: 200,
    maxFunnels: -1, // Unlimited
    maxContacts: 5000,
    hasAdvancedReports: true,
    hasPrioritySupport: true,
    hasDedicatedManager: false,
  },
  enterprise: {
    maxWhatsappAccounts: 5,
    maxMessagesPerHour: 1000,
    maxFunnels: -1, // Unlimited
    maxContacts: -1, // Unlimited
    hasAdvancedReports: true,
    hasPrioritySupport: true,
    hasDedicatedManager: true,
  },
};

export function getPlanLimits(planType: PlanType): PlanLimits {
  return PLAN_LIMITS[planType] || PLAN_LIMITS.free;
}

export function isWithinLimit(current: number, limit: number): boolean {
  if (limit === -1) return true; // Unlimited
  return current < limit; // Returns true if we can add one more
}

export function canAddOne(current: number, limit: number): boolean {
  if (limit === -1) return true; // Unlimited
  return current < limit; // Can add if current is less than limit
}

export function formatLimit(limit: number): string {
  if (limit === -1) return "Ilimitado";
  return limit.toLocaleString("pt-BR");
}

export interface UsageInfo {
  whatsappAccounts: { current: number; limit: number; percentage: number };
  messagesThisHour: { current: number; limit: number; percentage: number };
  funnels: { current: number; limit: number; percentage: number };
  contacts: { current: number; limit: number; percentage: number };
}

export function calculatePercentage(current: number, limit: number): number {
  if (limit === -1) return 0; // Unlimited shows as 0%
  if (limit === 0) return 100;
  return Math.min(100, Math.round((current / limit) * 100));
}

export type LimitCheckResult = 
  | { allowed: true }
  | { allowed: false; reason: string; limit: number; current: number };

export function checkLimitForCreation(
  resourceType: string,
  current: number,
  limit: number
): LimitCheckResult {
  if (limit === -1) {
    return { allowed: true };
  }
  
  const wouldExceed = current + 1 > limit;
  
  if (wouldExceed) {
    return {
      allowed: false,
      reason: `Limite de ${resourceType} atingido (${current}/${limit})`,
      limit,
      current,
    };
  }
  
  return { allowed: true };
}

export function checkLimit(
  resourceType: string,
  current: number,
  limit: number
): LimitCheckResult {
  return checkLimitForCreation(resourceType, current, limit);
}
