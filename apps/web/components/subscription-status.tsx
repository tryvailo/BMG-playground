'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { useUser } from '@kit/supabase/hooks/use-user';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

interface Subscription {
  id: string;
  plan_name: string;
  plan_id: string;
  price: number;
  currency: string;
  billing_interval: string;
  payment_method: string;
  payment_status: string;
  invoice_number: string | null;
  expires_at: string | null;
  paid_at: string | null;
  created_at: string;
}

export function SubscriptionStatus() {
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
        // No subscription found is not an error
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as Subscription | null;
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true, // Refetch when window gains focus to show updated status
    refetchInterval: 30000, // Refetch every 30 seconds to check for status updates
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    // Show warning when no subscription exists
    return (
      <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900">No Subscription Found</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Your account doesn&apos;t have an active subscription. Please contact support or complete the onboarding process.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          icon: <CheckCircle2 size={20} className="text-green-600" />,
          badge: 'bg-green-100 text-green-800',
          text: 'Active',
          description: 'Your subscription is active',
        };
      case 'pending':
        return {
          icon: <Clock size={20} className="text-yellow-600" />,
          badge: 'bg-yellow-100 text-yellow-800',
          text: 'Pending Payment',
          description: subscription.payment_method === 'manual' 
            ? 'Invoice not paid yet. Your account will be activated after payment confirmation.'
            : 'Payment processing',
        };
      case 'failed':
        return {
          icon: <XCircle size={20} className="text-red-600" />,
          badge: 'bg-red-100 text-red-800',
          text: 'Payment Failed',
          description: 'Please update your payment method',
        };
      case 'canceled':
        return {
          icon: <AlertCircle size={20} className="text-gray-600" />,
          badge: 'bg-gray-100 text-gray-800',
          text: 'Canceled',
          description: 'Subscription has been canceled',
        };
      default:
        return {
          icon: <Clock size={20} className="text-gray-600" />,
          badge: 'bg-gray-100 text-gray-800',
          text: status,
          description: '',
        };
    }
  };

  const statusConfig = getStatusConfig(subscription.payment_status);
  const isExpired = subscription.expires_at && new Date(subscription.expires_at) < new Date();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {statusConfig.icon}
          <div>
            <h3 className="font-semibold text-slate-900">Subscription Status</h3>
            <p className="text-sm text-slate-500">{subscription.plan_name} Plan</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.badge}`}>
          {statusConfig.text}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Plan:</span>
          <span className="font-medium text-slate-900">
            {subscription.plan_name} ({subscription.billing_interval === 'year' ? 'Yearly' : 'Monthly'})
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Amount:</span>
          <span className="font-medium text-slate-900">
            {subscription.currency} {subscription.price.toFixed(2)} / {subscription.billing_interval === 'year' ? 'year' : 'month'}
          </span>
        </div>

        {subscription.invoice_number && (
          <div className="flex justify-between">
            <span className="text-slate-600">Invoice:</span>
            <span className="font-mono text-slate-900">{subscription.invoice_number}</span>
          </div>
        )}

        {subscription.expires_at && (
          <div className="flex justify-between">
            <span className="text-slate-600">Expires:</span>
            <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-slate-900'}`}>
              {new Date(subscription.expires_at).toLocaleDateString()}
            </span>
          </div>
        )}

        {subscription.payment_method === 'manual' && subscription.payment_status === 'pending' && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800 font-medium mb-1">
                ⚠️ Invoice Not Paid
              </p>
              <p className="text-xs text-yellow-700">
                {statusConfig.description}
              </p>
              {subscription.invoice_number && (
                <p className="text-xs text-yellow-600 mt-2 pt-2 border-t border-yellow-200">
                  Invoice number: <span className="font-mono font-semibold">{subscription.invoice_number}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



