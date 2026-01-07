'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { useUser } from '@kit/supabase/hooks/use-user';
import { Lock, AlertCircle } from 'lucide-react';
import { getSubscriptionAccessLevel, type Subscription } from '~/lib/utils/subscription';

interface SubscriptionGateProps {
  children: React.ReactNode;
  requireFullAccess?: boolean; // If true, requires paid subscription. If false, allows pending (limited access)
  fallback?: React.ReactNode;
}

/**
 * Component that gates content based on subscription status
 * - If requireFullAccess=true: only shows content if subscription is paid
 * - If requireFullAccess=false: shows content for both paid and pending subscriptions
 */
export function SubscriptionGate({ 
  children, 
  requireFullAccess = false,
  fallback 
}: SubscriptionGateProps) {
  const client = useSupabase();
  const { data: user } = useUser();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (client as any)
        .from('subscriptions')
        .select('*')
        .eq('account_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No subscription found
        }
        throw error;
      }

      return data as Subscription | null;
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  const accessLevel = getSubscriptionAccessLevel(subscription ?? null);

  // If no subscription at all
  if (accessLevel === 'none') {
    return fallback || (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <AlertCircle size={24} className="text-yellow-600 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-900 mb-2">Subscription Required</h3>
        <p className="text-sm text-slate-600 mb-4">
          Please subscribe to a plan to access this feature.
        </p>
      </div>
    );
  }

  // If requires full access but only has limited (pending)
  if (requireFullAccess && accessLevel === 'limited') {
    return fallback || (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Lock size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Limited Access</h3>
            <p className="text-sm text-slate-600 mb-2">
              This feature requires a paid subscription. Your subscription is currently pending payment.
            </p>
            {subscription?.payment_method === 'manual' && (
              <p className="text-xs text-blue-700">
                Our sales team will send you an invoice shortly. After payment confirmation, you&apos;ll get full access.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Has required access level
  return <>{children}</>;
}



