#!/usr/bin/env tsx
/**
 * Test script to verify dashboard data is loaded correctly
 * 
 * This script simulates what the dashboard component does:
 * 1. Finds demo project by domain
 * 2. Fetches weekly_stats
 * 3. Calculates metrics
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('💡 To get the key, run: pnpm supabase status');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testDashboardData() {
  console.log('🔍 Testing dashboard data loading...\n');

  try {
    // Step 1: Find demo project by domain
    console.log('1️⃣ Finding demo project...');
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('domain', 'demo-clinic.com')
      .single();

    if (projectError || !project) {
      console.error('❌ Demo project not found:', projectError?.message);
      return false;
    }

    console.log('✅ Found project:', project.name, 'ID:', project.id);
    console.log('   Domain:', project.domain);
    console.log('');

    // Step 2: Fetch weekly_stats
    console.log('2️⃣ Fetching weekly_stats...');
    const { data: weeklyStats, error: statsError } = await supabase
      .from('weekly_stats')
      .select('*')
      .eq('project_id', project.id)
      .order('week_start', { ascending: true });

    if (statsError) {
      console.error('❌ Error fetching weekly_stats:', statsError.message);
      return false;
    }

    if (!weeklyStats || weeklyStats.length === 0) {
      console.error('❌ No weekly_stats found for project');
      return false;
    }

    console.log(`✅ Found ${weeklyStats.length} records`);
    console.log('');

    // Step 3: Check data quality
    console.log('3️⃣ Checking data quality...');
    const latestStats = weeklyStats[weeklyStats.length - 1];
    
    if (!latestStats) {
      console.error('❌ No stats found');
      return false;
    }

    console.log('Latest stats (', latestStats.week_start, '):');
    console.log('  - Visibility:', latestStats.visability_score);
    console.log('  - Tech:', latestStats.tech_score);
    console.log('  - Content:', latestStats.content_score);
    console.log('  - E-E-A-T:', latestStats.eeat_score);
    console.log('  - Local:', latestStats.local_score);
    console.log('  - ClinicAI Score:', latestStats.clinic_ai_score);
    console.log('  - Avg Position:', latestStats.avg_position);
    console.log('');

    // Check if all values are non-zero
    const hasData = 
      (latestStats.visability_score && latestStats.visability_score > 0) &&
      (latestStats.tech_score && latestStats.tech_score > 0) &&
      (latestStats.content_score && latestStats.content_score > 0) &&
      (latestStats.eeat_score && latestStats.eeat_score > 0) &&
      (latestStats.local_score && latestStats.local_score > 0) &&
      (latestStats.clinic_ai_score && latestStats.clinic_ai_score > 0);

    if (!hasData) {
      console.error('❌ Some values are zero or null!');
      return false;
    }

    console.log('✅ All values are non-zero');
    console.log('');

    // Step 4: Show sample history data
    console.log('4️⃣ Sample history data (first 3 months):');
    weeklyStats.slice(0, 3).forEach((stat) => {
      console.log(`  ${stat.week_start}: ClinicAI Score = ${stat.clinic_ai_score}%`);
    });
    console.log('');

    console.log('✅ Dashboard data test passed!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`  - Project: ${project.name}`);
    console.log(`  - Total records: ${weeklyStats.length}`);
    console.log(`  - Date range: ${weeklyStats[0]?.week_start} to ${latestStats.week_start}`);
    console.log(`  - Latest ClinicAI Score: ${latestStats.clinic_ai_score}%`);
    
    return true;
  } catch (error) {
    console.error('❌ Error during test:', error);
    return false;
  }
}

// Run test
testDashboardData()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });




