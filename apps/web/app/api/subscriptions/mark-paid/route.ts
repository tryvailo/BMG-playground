import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { requireUser } from '@kit/supabase/require-user';

/**
 * Admin endpoint to mark a subscription as paid (for manual payments)
 * Uses admin client to bypass RLS and allow updating any subscription
 * TODO: Add admin role check in production
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated first
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
    const adminId = userResult.data.id;
    const body = await request.json();

    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing subscriptionId' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS for admin operations
    const adminClient = await getSupabaseServerAdminClient();

    // First, get the subscription to check billing interval
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingSubscription, error: fetchError } = await (adminClient as any)
      .from('subscriptions')
      .select('billing_interval, account_id')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !existingSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Calculate expiration date based on billing interval
    const now = new Date();
    if (existingSubscription.billing_interval === 'year') {
      now.setFullYear(now.getFullYear() + 1);
    } else {
      now.setMonth(now.getMonth() + 1);
    }

    // Update subscription status to paid and activate account
    const paidAt = new Date().toISOString();
    const expiresAt = now.toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscription, error } = await (adminClient as any)
      .from('subscriptions')
      .update({
        payment_status: 'paid',
        paid_at: paidAt,
        paid_by: adminId,
        expires_at: expiresAt,
        updated_at: paidAt,
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('[MarkPaid] Error updating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to update subscription', details: error.message },
        { status: 500 }
      );
    }

    console.log('[MarkPaid] ✅ Subscription activated:', {
      subscriptionId,
      accountId: subscription.account_id,
      status: subscription.payment_status,
      expiresAt: subscription.expires_at,
    });

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Subscription activated successfully. Account now has full access.',
    });
  } catch (error) {
    console.error('[MarkPaid] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

