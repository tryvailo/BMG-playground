import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';

/**
 * API endpoint to request an invoice for manual payment (UA market)
 * Creates a subscription with payment_method='manual' and payment_status='pending'
 */
export async function POST(request: NextRequest) {
  try {
    const client = await getSupabaseServerClient();
    const userResult = await requireUser(client);

    if (userResult.error || !userResult.data) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = userResult.data.id;
    const body = await request.json();

    const { planId, planName, price, billingInterval, currency = 'USD', metadata = {} } = body;

    // Validate required fields
    if (!planId || !planName || !price || !billingInterval) {
      return NextResponse.json(
        { error: 'Missing required fields: planId, planName, price, billingInterval' },
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Calculate expiration date (30 days from now for manual payments)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create subscription with manual payment method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscription, error } = await (client as any)
      .from('subscriptions')
      .insert({
        account_id: userId,
        plan_id: planId,
        plan_name: planName,
        price: parseFloat(price),
        currency,
        billing_interval: billingInterval,
        payment_method: 'manual',
        payment_status: 'pending',
        invoice_number: invoiceNumber,
        expires_at: expiresAt.toISOString(),
        metadata: {
          ...metadata,
          requested_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) {
      console.error('[RequestInvoice] Error creating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to create subscription request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        invoice_number: invoiceNumber,
        status: 'pending',
        message: 'Invoice request created. We will send you an invoice shortly.',
      },
    });
  } catch (error) {
    console.error('[RequestInvoice] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

