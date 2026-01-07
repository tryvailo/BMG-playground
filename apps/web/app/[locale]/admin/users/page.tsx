'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '~/lib/navigation';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { CheckCircle2, XCircle, Clock, Search, RefreshCw } from 'lucide-react';
import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@kit/ui/dialog';
import { Label } from '@kit/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';

interface Subscription {
  id: string;
  account_id: string;
  plan_id: string;
  plan_name: string;
  price: number;
  currency: string;
  billing_interval: string;
  payment_method: string;
  payment_status: string;
  invoice_number: string | null;
  created_at: string;
  paid_at: string | null;
  expires_at: string | null;
  metadata: {
    companyName?: string;
    contactEmail?: string;
  };
}

interface Account {
  id: string;
  name: string;
  email: string;
}

export default function AdminUsersPage() {
  const _router = useRouter();
  const _client = useSupabase();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [accounts, setAccounts] = useState<Record<string, Account>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ totalAccounts: number; totalSubscriptions: number } | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [newSubscriptionData, setNewSubscriptionData] = useState({
    planId: 'starter',
    billingInterval: 'month',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      // Use admin API endpoint to get all subscriptions (bypasses RLS)
      const response = await fetch('/api/admin/subscriptions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorData: Record<string, string> = {};
        const responseText = await response.text();
        
        try {
          errorData = JSON.parse(responseText);
        } catch {
          // If response is not JSON, use the text as error message
          errorData = { error: responseText || `HTTP ${response.status}` };
        }
        
        const errorMessage = errorData.error || errorData.details || `Failed to load data (${response.status})`;
        console.error('Error loading subscriptions:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          responseText,
        });
        setError(errorMessage);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setSubscriptions(data.subscriptions || []);
        setAccounts(data.accounts || {});
        setStats({
          totalAccounts: data.totalAccounts || 0,
          totalSubscriptions: data.totalSubscriptions || 0,
        });
        console.log('[AdminUsers] Loaded:', {
          subscriptions: data.subscriptions?.length || 0,
          accounts: Object.keys(data.accounts || {}).length,
        });
        
        // Debug: Log subscription details
        if (data.subscriptions && data.subscriptions.length > 0) {
          console.log('[AdminUsers] Sample subscription from API:', {
            id: data.subscriptions[0].id,
            account_id: data.subscriptions[0].account_id,
            plan_id: data.subscriptions[0].plan_id,
            plan_name: data.subscriptions[0].plan_name,
            payment_status: data.subscriptions[0].payment_status,
          });
        } else {
          console.log('[AdminUsers] ⚠️ No subscriptions in API response');
        }
        
        // Debug: Log account details
        const accountKeys = Object.keys(data.accounts || {});
        if (accountKeys.length > 0 && accountKeys[0] !== undefined) {
          const firstKey = accountKeys[0];
          console.log('[AdminUsers] Sample account from API:', {
            id: firstKey,
            ...data.accounts[firstKey],
          });
        }
      } else {
        const errorMessage = data.error || 'Failed to load subscriptions';
        console.error('Failed to load subscriptions:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error loading data:', error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async (accountId: string, planId: string, planName: string, price: number, period: string) => {
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: accountId,
          plan_id: planId,
          plan_name: planName,
          price: price,
          currency: 'USD',
          billing_interval: period,
          payment_method: 'manual',
          payment_status: 'pending',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert('Error: ' + (data.error || 'Failed to create subscription'));
        return;
      }

      alert('Subscription created!');
      loadData();
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Error creating subscription. Please try again.');
    }
  };

  const handleMarkAsPaid = async (subscriptionId: string) => {
    if (!confirm('Mark this subscription as paid?')) {
      return;
    }

    try {
      const response = await fetch('/api/subscriptions/mark-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Subscription marked as paid! Full access granted.');
        loadData();
      } else {
        alert('Error: ' + (data.error || 'Failed to mark as paid'));
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('Error marking as paid. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 size={16} className="text-green-600" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-600" />;
      case 'failed':
      case 'canceled':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-semibold';
    switch (status) {
      case 'paid':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Paid</span>;
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</span>;
      case 'failed':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Failed</span>;
      case 'canceled':
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Canceled</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  // Get all account IDs that have subscriptions
  const accountsWithSubscriptions = new Set(subscriptions.map(s => s.account_id));
  
  // Get accounts without subscriptions
  const accountsWithoutSubscriptions = Object.values(accounts).filter(
    acc => !accountsWithSubscriptions.has(acc.id)
  );

  const filteredSubscriptions = subscriptions.filter(sub => {
    const account = accounts[sub.account_id];
    const matchesSearch = !searchTerm || 
      sub.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plan_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || sub.payment_status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Filter accounts without subscriptions by search term
  const filteredAccountsWithoutSubs = accountsWithoutSubscriptions.filter(acc => {
    if (!searchTerm) return true;
    return (
      acc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={32} className="animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">User Subscriptions</h1>
          <p className="text-slate-600">Manage user subscriptions and mark payments as paid</p>
          {stats && (
            <div className="mt-4 flex gap-4 text-sm">
              <span className="text-slate-500">
                Total Accounts: <span className="font-semibold text-slate-900">{stats.totalAccounts}</span>
              </span>
              <span className="text-slate-500">
                Total Subscriptions: <span className="font-semibold text-slate-900">{stats.totalSubscriptions}</span>
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800 font-semibold mb-1">Error loading data</p>
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={loadData}
              className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by invoice, name, email, or plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Invoice Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSubscriptions.length === 0 && filteredAccountsWithoutSubs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                      {searchTerm ? 'No users or subscriptions found' : 'No users found'}
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* Users with subscriptions */}
                    {filteredSubscriptions.map((sub) => {
                    const account = accounts[sub.account_id];
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-slate-900">{account?.name || 'Unknown'}</div>
                            <div className="text-sm text-slate-500">{account?.email || 'No email'}</div>
                            {sub.metadata?.companyName && (
                              <div className="text-xs text-slate-400">{sub.metadata.companyName}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-slate-900">{sub.plan_name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {sub.billing_interval === 'year' ? 'Yearly' : 'Monthly'} • {sub.plan_id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-slate-900">
                            {sub.currency} {sub.price.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            sub.payment_method === 'stripe' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {sub.payment_method === 'stripe' ? 'Stripe' : 'Manual'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono text-sm text-slate-600">
                            {sub.invoice_number || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(sub.payment_status)}
                            {getStatusBadge(sub.payment_status)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {sub.payment_status === 'pending' && sub.payment_method === 'manual' && (
                            <button
                              onClick={() => handleMarkAsPaid(sub.id)}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                              Mark as Paid
                            </button>
                          )}
                          {sub.payment_status === 'paid' && sub.paid_at && (
                            <div className="text-xs text-slate-500">
                              Paid: {new Date(sub.paid_at).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                    {/* Users without subscriptions */}
                    {filteredAccountsWithoutSubs.map((account) => (
                      <tr key={`no-sub-${account.id}`} className="hover:bg-slate-50 bg-slate-50/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-slate-900">{account.name || 'Unknown'}</div>
                            <div className="text-sm text-slate-500">{account.email || 'No email'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-400 italic">No subscription</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-400">-</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-400">-</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-400">-</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            No subscription
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedAccountId(account.id);
                              setIsCreateDialogOpen(true);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            Create Subscription
                          </button>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Subscription Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Subscription</DialogTitle>
              <DialogDescription>
                Create a new subscription for this user. The subscription will be created with pending status.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="plan-select">Plan</Label>
                <Select
                  value={newSubscriptionData.planId}
                  onValueChange={(value) => setNewSubscriptionData({ ...newSubscriptionData, planId: value })}
                >
                  <SelectTrigger id="plan-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter - $99/month</SelectItem>
                    <SelectItem value="growth">Growth - $399/month</SelectItem>
                    <SelectItem value="enterprise">Enterprise - $499/month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="interval-select">Billing Interval</Label>
                <Select
                  value={newSubscriptionData.billingInterval}
                  onValueChange={(value) => setNewSubscriptionData({ ...newSubscriptionData, billingInterval: value as 'month' | 'year' })}
                >
                  <SelectTrigger id="interval-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setSelectedAccountId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!selectedAccountId) return;
                  const planNames: Record<string, string> = {
                    starter: 'Starter',
                    growth: 'Growth',
                    enterprise: 'Enterprise',
                  };
                  const planPrices: Record<string, number> = {
                    starter: 99,
                    growth: 399,
                    enterprise: 499,
                  };
                  const planName = planNames[newSubscriptionData.planId] || 'Starter';
                  const price = planPrices[newSubscriptionData.planId] || 99;
                  handleCreateSubscription(
                    selectedAccountId,
                    newSubscriptionData.planId,
                    planName,
                    price,
                    newSubscriptionData.billingInterval
                  );
                  setIsCreateDialogOpen(false);
                  setSelectedAccountId(null);
                }}
              >
                Create Subscription
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

