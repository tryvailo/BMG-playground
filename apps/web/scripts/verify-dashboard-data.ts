#!/usr/bin/env tsx
/**
 * Script to verify that dashboard data is non-zero and properly loaded
 */

import { createClient } from '@supabase/supabase-js';

// For local Supabase, use default anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'; // Default local anon key

console.log('Using Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDashboardData() {
  console.log('🔍 Verifying dashboard data...\n');

  try {
    // 1. Check project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, domain, name')
      .eq('domain', 'demo-clinic.com')
      .single();

    if (projectError || !project) {
      console.error('❌ Project not found:', projectError);
      return false;
    }

    console.log('✅ Project found:', {
      id: project.id,
      domain: project.domain,
      name: project.name,
    });

    // 2. Check weekly_stats data
    const { data: weeklyStats, error: statsError } = await supabase
      .from('weekly_stats')
      .select('*')
      .eq('project_id', project.id)
      .gte('week_start', '2025-01-01')
      .lt('week_start', '2026-01-01')
      .order('week_start', { ascending: true });

    if (statsError) {
      console.error('❌ Failed to fetch weekly_stats:', statsError);
      return false;
    }

    if (!weeklyStats || weeklyStats.length === 0) {
      console.error('❌ No weekly_stats found for 2025');
      return false;
    }

    console.log(`\n✅ Found ${weeklyStats.length} records for 2025\n`);

    // 3. Check for zero values
    const zeroChecks = {
      clinic_ai_score: weeklyStats.filter((ws) => !ws.clinic_ai_score || ws.clinic_ai_score === 0).length,
      visability_score: weeklyStats.filter((ws) => !ws.visability_score || ws.visability_score === 0).length,
      tech_score: weeklyStats.filter((ws) => !ws.tech_score || ws.tech_score === 0).length,
      content_score: weeklyStats.filter((ws) => !ws.content_score || ws.content_score === 0).length,
      eeat_score: weeklyStats.filter((ws) => !ws.eeat_score || ws.eeat_score === 0).length,
      local_score: weeklyStats.filter((ws) => !ws.local_score || ws.local_score === 0).length,
    };

    const hasZeros = Object.values(zeroChecks).some((count) => count > 0);

    if (hasZeros) {
      console.error('❌ Found zero values:');
      Object.entries(zeroChecks).forEach(([key, count]) => {
        if (count > 0) {
          console.error(`   - ${key}: ${count} zero values`);
        }
      });
      return false;
    }

    console.log('✅ All values are non-zero\n');

    // 4. Show sample data
    console.log('📊 Sample data (first 3 and last 3 records):\n');
    const firstThree = weeklyStats.slice(0, 3);
    const lastThree = weeklyStats.slice(-3);

    [...firstThree, ...lastThree].forEach((ws) => {
      console.log(`  ${ws.week_start}:`, {
        visibility: ws.visability_score?.toFixed(1),
        tech: ws.tech_score?.toFixed(1),
        content: ws.content_score?.toFixed(1),
        eeat: ws.eeat_score?.toFixed(1),
        local: ws.local_score?.toFixed(1),
        clinicAI: ws.clinic_ai_score?.toFixed(1),
        position: ws.avg_position?.toFixed(1),
      });
    });

    // 5. Verify calculation
    const latest = weeklyStats[weeklyStats.length - 1]!;
    const calculated = 
      (latest.visability_score || 0) * 0.25 +
      (latest.tech_score || 0) * 0.20 +
      (latest.content_score || 0) * 0.20 +
      (latest.eeat_score || 0) * 0.15 +
      (latest.local_score || 0) * 0.10;

    const diff = Math.abs((latest.clinic_ai_score || 0) - calculated);

    console.log(`\n🧮 Calculation verification (latest record):`);
    console.log(`   Stored: ${latest.clinic_ai_score?.toFixed(2)}`);
    console.log(`   Calculated: ${calculated.toFixed(2)}`);
    console.log(`   Difference: ${diff.toFixed(4)}`);

    if (diff > 0.01) {
      console.error('❌ Calculation mismatch!');
      return false;
    }

    console.log('✅ Calculation matches\n');

    // 6. Test dashboard action
    console.log('🧪 Testing dashboard action...');
    const { getDashboardMetrics } = await import('../lib/actions/dashboard');
    
    const metrics = await getDashboardMetrics({
      projectId: 'demo',
      dateRange: {
        from: new Date('2025-01-01'),
        to: new Date('2025-12-31'),
      },
    });

    if (!metrics) {
      console.error('❌ Dashboard metrics returned null');
      return false;
    }

    console.log('\n📈 Dashboard KPIs:');
    console.log(`   ClinicAI Score: ${metrics.kpis.clinicAIScore.toFixed(1)}%`);
    console.log(`   Visibility: ${metrics.kpis.serviceVisibility.toFixed(1)}%`);
    console.log(`   Tech: ${metrics.kpis.techOptimization.toFixed(1)}%`);
    console.log(`   Content: ${metrics.kpis.contentOptimization.toFixed(1)}%`);
    console.log(`   E-E-A-T: ${metrics.kpis.eeatSignal.toFixed(1)}%`);
    console.log(`   Local: ${metrics.kpis.localSignal.toFixed(1)}%`);
    console.log(`   Avg Position: ${metrics.kpis.averagePosition?.toFixed(1) || 'N/A'}`);

    const hasZeroKPIs = 
      metrics.kpis.clinicAIScore === 0 ||
      metrics.kpis.serviceVisibility === 0 ||
      metrics.kpis.techOptimization === 0 ||
      metrics.kpis.contentOptimization === 0 ||
      metrics.kpis.eeatSignal === 0 ||
      metrics.kpis.localSignal === 0;

    if (hasZeroKPIs) {
      console.error('\n❌ Some KPIs are zero!');
      return false;
    }

    console.log('\n✅ All KPIs are non-zero');
    console.log(`\n✅ Dashboard data verification complete!`);
    return true;

  } catch (error) {
    console.error('❌ Error during verification:', error);
    return false;
  }
}

verifyDashboardData()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
