#!/usr/bin/env tsx
/**
 * Script to create a test user with subscription for testing
 * Usage: pnpm tsx scripts/create-test-user.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
// For local development, use the default service role key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  console.log('Creating test user...');

  const email = `test-friendlic-${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  const name = 'Test Friendlic User';

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    return;
  }

  if (!authData.user) {
    console.error('No user created');
    return;
  }

  const userId = authData.user.id;
  console.log('✅ Created auth user:', userId, email);

  // 2. Create account
  const { data: accountData, error: accountError } = await supabase
    .from('accounts')
    .insert({
      id: userId,
      name,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (accountError) {
    console.error('Error creating account:', accountError);
    // Continue anyway - account might be created by trigger
  } else {
    console.log('✅ Created account:', accountData.id);
  }

  // 3. Create project
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .insert({
      organization_id: userId,
      domain: 'friendlic.clinic',
      name: 'Френдлік',
      settings: {
        region: 'UA',
        city: 'Київ',
        language: 'uk',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (projectError) {
    console.error('Error creating project:', projectError);
  } else {
    console.log('✅ Created project:', projectData.id, projectData.domain);
  }

  // 4. Create subscription with Starter plan
  const { data: subscriptionData, error: subscriptionError } = await supabase
    .from('subscriptions')
    .insert({
      account_id: userId,
      plan_id: 'starter',
      plan_name: 'Starter',
      price: 99,
      currency: 'USD',
      billing_interval: 'month',
      payment_method: 'manual',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (subscriptionError) {
    console.error('❌ Error creating subscription:', subscriptionError);
    console.error('Error details:', JSON.stringify(subscriptionError, null, 2));
  } else {
    console.log('✅ Created subscription:', subscriptionData.id);
    console.log('   Plan:', subscriptionData.plan_name);
    console.log('   Status:', subscriptionData.payment_status);
  }

  console.log('\n📋 Test User Credentials:');
  console.log('   Email:', email);
  console.log('   Password:', password);
  console.log('   User ID:', userId);
  console.log('\n✅ Test user created successfully!');
  console.log('   You can now login at: http://localhost:3000/auth/sign-in');
  console.log('   Check admin panel at: http://localhost:3000/admin/users');
}

createTestUser().catch(console.error);

