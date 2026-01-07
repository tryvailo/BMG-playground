import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';

/**
 * Admin API endpoint to get all subscriptions
 * Uses admin client to bypass RLS
 * TODO: Add admin role check in production
 */
export async function GET(_request: NextRequest) {
  try {
    // First verify user is authenticated
    const client = await getSupabaseServerClient();
    const userResult = await requireUser(client);

    if (userResult.error || !userResult.data) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Add admin role check here
    // For now, allow any authenticated user (remove in production)

    // Use admin client to bypass RLS and get all subscriptions
    let adminClient;
    try {
      adminClient = await getSupabaseServerAdminClient();
      console.log('[AdminSubscriptions] Admin client initialized successfully');
    } catch (error) {
      console.error('[AdminSubscriptions] Failed to initialize admin client:', error);
      return NextResponse.json(
        { 
          error: 'Failed to initialize admin client', 
          details: error instanceof Error ? error.message : 'Unknown error',
          code: 'ADMIN_CLIENT_INIT_ERROR'
        },
        { status: 500 }
      );
    }

    console.log('[AdminSubscriptions] Attempting to load subscriptions...');

    // Load all subscriptions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriptions, error: subsError } = await (adminClient as any)
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (subsError) {
      console.error('[AdminSubscriptions] Error loading subscriptions:', {
        code: subsError.code,
        message: subsError.message,
        details: subsError.details,
        hint: subsError.hint,
      });
      
      // Check if table doesn't exist
      if (subsError.code === '42P01' || subsError.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Subscriptions table does not exist', 
            details: 'Please apply migration 20250130_add_subscriptions_table.sql',
            code: 'TABLE_NOT_FOUND'
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to load subscriptions', 
          details: subsError.message || 'Unknown error',
          code: subsError.code || 'UNKNOWN_ERROR'
        },
        { status: 500 }
      );
    }

    console.log('[AdminSubscriptions] Loaded subscriptions:', subscriptions?.length || 0);
    if (subscriptions && subscriptions.length > 0 && subscriptions[0]) {
      const firstSub = subscriptions[0];
      console.log('[AdminSubscriptions] Sample subscription:', {
        id: firstSub.id,
        account_id: firstSub.account_id,
        plan_id: firstSub.plan_id,
        plan_name: firstSub.plan_name,
        payment_status: firstSub.payment_status,
      });
    } else {
      console.log('[AdminSubscriptions] ⚠️ No subscriptions found in database');
    }

    // Load ALL accounts (not just those with subscriptions)
    // This allows showing users without subscriptions
    console.log('[AdminSubscriptions] Attempting to load accounts...');
    
    const { data: allAccounts, error: accountsError } = await adminClient
      .from('accounts')
      .select('id, name, email')
      .order('created_at', { ascending: false });

    const accounts: Record<string, { id: string; name: string; email: string }> = {};

    if (accountsError) {
      console.error('[AdminSubscriptions] Error loading accounts:', {
        code: accountsError.code,
        message: accountsError.message,
        details: accountsError.details,
      });
      // Don't fail if accounts can't be loaded, but log the error
    } else if (allAccounts) {
      console.log('[AdminSubscriptions] Loaded accounts:', allAccounts.length);
      allAccounts.forEach(acc => {
        accounts[acc.id] = {
          id: acc.id,
          name: acc.name,
          email: acc.email || '',
        };
      });
    }

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions || [],
      accounts,
      totalAccounts: allAccounts?.length || 0,
      totalSubscriptions: subscriptions?.length || 0,
    });
  } catch (error) {
    console.error('[AdminSubscriptions] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Admin API endpoint to create a subscription
 * Uses admin client to bypass RLS
 */
export async function POST(request: NextRequest) {
  try {
    // First verify user is authenticated
    const client = await getSupabaseServerClient();
    const userResult = await requireUser(client);

    if (userResult.error || !userResult.data) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Add admin role check here

    const body = await request.json();
    const { account_id, plan_id, plan_name, price, currency = 'USD', billing_interval, payment_method = 'manual', payment_status = 'pending' } = body;

    // Validate required fields
    if (!account_id || !plan_id || !plan_name || !price || !billing_interval) {
      return NextResponse.json(
        { error: 'Missing required fields: account_id, plan_id, plan_name, price, billing_interval' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const adminClient = await getSupabaseServerAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscription, error } = await (adminClient as any)
      .from('subscriptions')
      .insert({
        account_id,
        plan_id,
        plan_name,
        price: parseFloat(price),
        currency,
        billing_interval,
        payment_method,
        payment_status,
      })
      .select()
      .single();

    if (error) {
      console.error('[AdminSubscriptions] Error creating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to create subscription', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('[AdminSubscriptions] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

