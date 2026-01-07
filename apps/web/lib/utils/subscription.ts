/**
 * Utility functions for subscription management and access control
 */

export type SubscriptionStatus = 'paid' | 'pending' | 'failed' | 'canceled' | null;

export interface Subscription {
  id: string;
  account_id: string;
  plan_id: string;
  plan_name: string;
  price: number;
  currency: string;
  billing_interval: string;
  payment_method: 'stripe' | 'manual';
  payment_status: SubscriptionStatus;
  invoice_number: string | null;
  expires_at: string | null;
  paid_at: string | null;
  created_at: string;
}

/**
 * Check if user has active (paid) subscription
 */
export function hasActiveSubscription(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  
  // Check if subscription is paid
  if (subscription.payment_status !== 'paid') return false;
  
  // Check if subscription hasn't expired
  if (subscription.expires_at) {
    const expiresAt = new Date(subscription.expires_at);
    const now = new Date();
    if (expiresAt < now) return false;
  }
  
  return true;
}

/**
 * Check if user has pending subscription (limited access)
 */
export function hasPendingSubscription(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  return subscription.payment_status === 'pending';
}

/**
 * Check if user has any subscription (paid or pending)
 */
export function hasAnySubscription(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  return subscription.payment_status === 'paid' || subscription.payment_status === 'pending';
}

/**
 * Get subscription access level
 * - 'full': paid subscription, full access
 * - 'limited': pending subscription, limited access
 * - 'none': no subscription or expired
 */
export function getSubscriptionAccessLevel(subscription: Subscription | null): 'full' | 'limited' | 'none' {
  if (hasActiveSubscription(subscription)) {
    return 'full';
  }
  if (hasPendingSubscription(subscription)) {
    return 'limited';
  }
  return 'none';
}





