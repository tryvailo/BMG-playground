#!/usr/bin/env tsx
/**
 * Script to create user tryvailo3@gmail.com
 * Usage: pnpm tsx scripts/create-tryvailo3-user.ts
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

async function createTryvailo3User() {
  console.log('Creating user tryvailo3@gmail.com...');

  const email = 'tryvailo3@gmail.com';
  const password = 'Qwerty123';
  const name = 'Tryvailo3 User';

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === email);

  if (existingUser) {
    console.log('⚠️  User already exists:', existingUser.id);
    console.log('   Email confirmed:', existingUser.email_confirmed_at ? 'Yes' : 'No');
    
    // Try to reset password
    console.log('\n🔄 Resetting password...');
    const { error: resetError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { password }
    );
    
    if (resetError) {
      console.error('❌ Error resetting password:', resetError);
    } else {
      console.log('✅ Password reset successfully');
    }
    
    // Confirm email if not confirmed
    if (!existingUser.email_confirmed_at) {
      console.log('\n🔄 Confirming email...');
      const { error: confirmError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { email_confirm: true }
      );
      
      if (confirmError) {
        console.error('❌ Error confirming email:', confirmError);
      } else {
        console.log('✅ Email confirmed');
      }
    }
    
    console.log('\n📋 User Credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   User ID:', existingUser.id);
    return;
  }

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
  });

  if (authError) {
    console.error('❌ Error creating auth user:', authError);
    return;
  }

  if (!authData.user) {
    console.error('❌ No user created');
    return;
  }

  const userId = authData.user.id;
  console.log('✅ Created auth user:', userId, email);

  // 2. Create account (if not exists)
  const { data: accountData, error: accountError } = await supabase
    .from('accounts')
    .upsert({
      id: userId,
      name,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    })
    .select()
    .single();

  if (accountError) {
    console.error('⚠️  Error creating/updating account:', accountError);
    // Continue anyway - account might be created by trigger
  } else {
    console.log('✅ Created/updated account:', accountData.id);
  }

  console.log('\n📋 User Credentials:');
  console.log('   Email:', email);
  console.log('   Password:', password);
  console.log('   User ID:', userId);
  console.log('\n✅ User created successfully!');
  console.log('   You can now login at: http://localhost:3000/auth/sign-in');
}

createTryvailo3User().catch(console.error);


