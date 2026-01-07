import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseClientKeys } from '@kit/supabase/get-supabase-client-keys';

/**
 * Helper function to create subscription for new account
 * Always creates subscription with pending status, even if planId is not provided
 * Uses default Starter plan if planId is missing
 */
async function createSubscriptionIfNeeded(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  userId: string,
  planId: string | undefined,
  interval: string | undefined,
  region: string | undefined
): Promise<void> {
  console.log('[CreateProject] Checking subscription creation:', { 
    planId, 
    region, 
    interval, 
    userId,
    hasPlanId: !!planId,
    isUA: region === 'UA',
    regionType: typeof region
  });

  // Check if subscription already exists for this account
  const { data: existingSubscription } = await client
    .from('subscriptions')
    .select('id')
    .eq('account_id', userId)
    .limit(1)
    .maybeSingle();

  if (existingSubscription) {
    console.log('[CreateProject] ⚠️ Subscription already exists for account:', userId);
    return;
  }

  const isUA = region === 'UA';
  const planPrices: Record<string, number> = {
    starter: 99,
    growth: 399,
    enterprise: 499,
  };
  const planNames: Record<string, string> = {
    starter: 'Starter',
    growth: 'Growth',
    enterprise: 'Enterprise',
  };

  // Use provided planId or default to 'starter' if not provided
  // This ensures every new account gets a subscription with pending status
  const finalPlanId = planId || 'starter';

  const subscriptionData = {
    account_id: userId,
    plan_id: finalPlanId,
    plan_name: planNames[finalPlanId] || 'Starter',
    price: planPrices[finalPlanId] || 99,
    currency: 'USD',
    billing_interval: interval || 'month',
    payment_method: isUA ? 'manual' : 'stripe',
    payment_status: 'pending', // Always create with pending status
  };

  console.log('[CreateProject] Creating subscription with data:', subscriptionData);

  const { data: createdSubscription, error: subscriptionError } = await client
    .from('subscriptions')
    .insert(subscriptionData)
    .select()
    .single();

  if (subscriptionError) {
    console.error('[CreateProject] ❌ Error creating subscription:', subscriptionError);
    console.error('[CreateProject] Error code:', subscriptionError.code);
    console.error('[CreateProject] Error message:', subscriptionError.message);
  } else {
    console.log('[CreateProject] ✅ SUCCESS - Created pending subscription:', {
      userId,
      subscriptionId: createdSubscription?.id,
      planId: createdSubscription?.plan_id,
      planName: createdSubscription?.plan_name,
      paymentStatus: createdSubscription?.payment_status,
    });
  }
}

/**
 * API endpoint to create a project from onboarding data
 * Uses domain, clinicName, region, city from onboarding
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId: providedUserId, domain, clinicName, region, city, language, planId, interval } = body;
    
    // Log all received data for debugging
    console.log('[CreateProject] Received request data:', {
      hasUserId: !!providedUserId,
      domain,
      clinicName,
      region,
      city,
      language,
      planId,
      interval,
      allKeys: Object.keys(body)
    });

    // Try to get auth token from Authorization header (for immediate post-signup requests)
    const authHeader = request.headers.get('authorization');
    let client = await getSupabaseServerClient();
    let userId: string;
    let useAdminClient = false;
    
    // Priority 1: If userId is provided in body (for post-signup without session)
    if (providedUserId) {
      userId = providedUserId;
      useAdminClient = true; // Use admin client to bypass RLS
      client = await getSupabaseServerAdminClient();
      console.log('[CreateProject] Using admin client with provided userId:', userId);
    }
    // Priority 2: If Authorization header is provided, extract user ID from token
    else if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const keys = getSupabaseClientKeys();
      
      // Decode JWT token to get user ID (simple base64 decode)
      try {
        const tokenPart = token.split('.')[1];
        if (!tokenPart) {
          throw new Error('Invalid token format');
        }
        const payload = JSON.parse(Buffer.from(tokenPart, 'base64').toString());
        userId = payload.sub;
      } catch (error) {
        console.error('[CreateProject] Error decoding token:', error);
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
      
      // Create a client with the provided token for database operations
      client = createClient(keys.url, keys.anonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;
    } 
    // Priority 3: Use standard server client and requireUser
    else {
      const userResult = await requireUser(client);
      if (userResult.error || !userResult.data) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      userId = userResult.data.id;
    }

    // Validate required fields
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Clean domain (remove protocol, www, path, etc.)
    let cleanDomain = domain.trim();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, ''); // Remove http:// or https://
    cleanDomain = cleanDomain.replace(/^www\./, ''); // Remove www.
    cleanDomain = cleanDomain.split('/')[0]; // Take only domain part (remove path)
    cleanDomain = cleanDomain.toLowerCase();
    cleanDomain = cleanDomain.trim();

    // If using admin client (post-signup without session), ensure account exists
    if (useAdminClient) {
      const { data: existingAccount } = await client
        .from('accounts')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!existingAccount) {
        // Try to get user email from auth.users using admin client
        let userEmail = 'user@example.com';
        let userName = 'User';
        
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: authUser, error: authError } = await (client as any).auth.admin.getUserById(userId);
          if (!authError && authUser?.user?.email) {
            userEmail = authUser.user.email;
            userName = userEmail.split('@')[0] || 'User';
          }
        } catch (error) {
          console.warn('[CreateProject] Could not get user email, using defaults:', error);
        }

        // Create account
        const { error: accountError } = await client
          .from('accounts')
          .insert({
            id: userId,
            name: userName,
            email: userEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (accountError) {
          console.error('[CreateProject] Error creating account:', accountError);
          // Continue anyway - account might be created by trigger
        } else {
          console.log('[CreateProject] Created account for user:', userId);
        }
      }
    }

    // Check if project already exists
    // Use maybeSingle() to handle case when no project exists
    const { data: existingProject, error: checkError } = await client
      .from('projects')
      .select('id')
      .eq('organization_id', userId)
      .limit(1)
      .maybeSingle();
    
    // If error is about schema cache, try to use RPC function as fallback
    if (checkError && checkError.message?.includes('schema cache')) {
      console.warn('[CreateProject] Schema cache error, using RPC fallback');
      // Use RPC function to ensure project exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client as any).rpc('ensure_user_has_project', { account_id: userId });
      // Try again
      const { data: retryProject } = await client
        .from('projects')
        .select('id')
        .eq('organization_id', userId)
        .limit(1)
        .maybeSingle();
      
      if (retryProject) {
        // Project was created by RPC, now update it
        const { data: updatedProject, error: updateError } = await client
          .from('projects')
          .update({
            domain: cleanDomain,
            name: clinicName || 'My Clinic',
            settings: {
              region: region || 'US',
              city: city || '',
              language: language || 'en',
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', retryProject.id)
          .select()
          .single();

        if (updateError) {
          console.error('[CreateProject] Error updating project:', updateError);
          return NextResponse.json(
            { error: 'Failed to update project' },
            { status: 500 }
          );
        }

        // Create subscription for RPC fallback case
        await createSubscriptionIfNeeded(client, userId, planId, interval, region);

        return NextResponse.json({
          success: true,
          project: updatedProject,
          message: 'Project updated with onboarding data',
        });
      }
    }

    if (existingProject) {
      // Update existing project with onboarding data
      const { data: updatedProject, error: updateError } = await client
        .from('projects')
        .update({
          domain: cleanDomain,
          name: clinicName || 'My Clinic',
          settings: {
            region: region || 'US',
            city: city || '',
            language: language || 'en',
            ...((existingProject as { settings?: Record<string, unknown> }).settings || {}),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProject.id)
        .select()
        .single();

      if (updateError) {
        console.error('[CreateProject] Error updating project:', updateError);
        return NextResponse.json(
          { error: 'Failed to update project' },
          { status: 500 }
        );
      }

      // Create subscription for existing project (moved before return!)
      await createSubscriptionIfNeeded(client, userId, planId, interval, region);

      return NextResponse.json({
        success: true,
        project: updatedProject,
        message: 'Project updated with onboarding data',
      });
    }

    // Create new project with onboarding data
    const { data: project, error } = await client
      .from('projects')
      .insert({
        organization_id: userId,
        domain: cleanDomain,
        name: clinicName || 'My Clinic',
        settings: {
          region: region || 'US',
          city: city || '',
          language: language || 'en',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[CreateProject] Error creating project:', error);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    // Create initial weekly_stats data (12 monthly data points for 2025)
    const weeklyStatsData = [];
    const months = [
      { week: '2025-01-06', scores: { visability: 45.0, tech: 60.0, content: 55.0, eeat: 50.0, local: 40.0, position: 8.5 } },
      { week: '2025-02-03', scores: { visability: 48.0, tech: 62.0, content: 58.0, eeat: 52.0, local: 42.0, position: 8.0 } },
      { week: '2025-03-03', scores: { visability: 52.0, tech: 65.0, content: 62.0, eeat: 55.0, local: 45.0, position: 7.5 } },
      { week: '2025-04-07', scores: { visability: 55.0, tech: 70.0, content: 65.0, eeat: 58.0, local: 48.0, position: 7.0 } },
      { week: '2025-05-05', scores: { visability: 58.0, tech: 72.0, content: 70.0, eeat: 60.0, local: 50.0, position: 6.5 } },
      { week: '2025-06-02', scores: { visability: 62.0, tech: 74.0, content: 72.0, eeat: 65.0, local: 52.0, position: 6.0 } },
      { week: '2025-07-07', scores: { visability: 65.0, tech: 76.0, content: 74.0, eeat: 68.0, local: 58.0, position: 5.5 } },
      { week: '2025-08-04', scores: { visability: 68.0, tech: 78.0, content: 76.0, eeat: 70.0, local: 62.0, position: 5.0 } },
      { week: '2025-09-01', scores: { visability: 72.0, tech: 80.0, content: 78.0, eeat: 72.0, local: 65.0, position: 4.5 } },
      { week: '2025-10-06', scores: { visability: 75.0, tech: 82.0, content: 80.0, eeat: 75.0, local: 68.0, position: 4.0 } },
      { week: '2025-11-03', scores: { visability: 78.0, tech: 84.0, content: 82.0, eeat: 78.0, local: 70.0, position: 3.5 } },
      { week: '2025-12-01', scores: { visability: 80.0, tech: 85.0, content: 84.0, eeat: 80.0, local: 72.0, position: 3.0 } },
    ];

    for (const month of months) {
      weeklyStatsData.push({
        project_id: project.id,
        week_start: month.week,
        visability_score: month.scores.visability,
        tech_score: month.scores.tech,
        content_score: month.scores.content,
        eeat_score: month.scores.eeat,
        local_score: month.scores.local,
        avg_position: month.scores.position,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const { error: statsError } = await client
      .from('weekly_stats')
      .insert(weeklyStatsData);

    if (statsError) {
      console.error('[CreateProject] Error creating weekly_stats:', statsError);
    }

    // Create subscription for new project
    await createSubscriptionIfNeeded(client, userId, planId, interval, region);

    return NextResponse.json({
      success: true,
      project,
      message: 'Project created successfully with onboarding data',
    });
  } catch (error) {
    console.error('[CreateProject] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



