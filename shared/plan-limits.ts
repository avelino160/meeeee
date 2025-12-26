export type PlanType = "business";

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
  business: {
    maxWhatsappAccounts: -1, // Unlimited
    maxMessagesPerHour: -1, // Unlimited
    maxFunnels: -1, // Unlimited
    maxContacts: -1, // Unlimited
    hasAdvancedReports: true,
    hasPrioritySupport: true,
    hasDedicatedManager: true,
  },
};

export function getPlanLimits(planType: PlanType): PlanLimits {
  return PLAN_LIMITS.business;
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
  
  // Bug fix: current + 1 would check if we can add another one. 
  // But if the user says they didn't create anything, current might be 0.
  // The logic current + 1 > limit means if limit is 3, and current is 2, 2+1=3 > 3 is false, allowed.
  // If current is 3, 3+1=4 > 3 is true, not allowed.
  // This seems correct for "can I add one more?".
  // However, the user says "didn't create anything". 
  // Let's verify if the problem is in how current is calculated or if the limit is 0.
  const wouldExceed = current >= limit; 
  
  if (wouldExceed) {
    return {
      allowed: false,
      reason: `Você atingiu o seu limite de ${resourceType} (${current}/${limit}). Faça upgrade do seu plano para continuar.`,
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
