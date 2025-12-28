#!/usr/bin/env tsx

/**
 * Test script for Local Indicators Audit
 * 
 * Usage: tsx scripts/test-local-indicators.ts <url> [clinicName] [city] [placeId] [googleApiKey] [firecrawlApiKey] [googleCustomSearchApiKey] [googleCustomSearchEngineId]
 * Example: tsx scripts/test-local-indicators.ts https://complimed.com.ua "complimed" "Odesa"
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { analyzeLocalIndicators } from '../lib/server/services/local/local-analyzer';

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          const cleanValue = value.replace(/^["']|["']$/g, '');
          process.env[key.trim()] = cleanValue;
        }
      }
    }
    console.log('✅ Loaded .env.local file');
  } catch {
    console.warn('⚠️  Could not load .env.local file:', error);
  }
}

async function main() {
  const url = process.argv[2] || 'https://complimed.com.ua';
  const clinicName = process.argv[3] || 'complimed';
  const city = process.argv[4] || 'Odesa';
  const placeId = process.argv[5];
  const googleApiKey = process.argv[6] || process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PAGESPEED_API_KEY;
  const firecrawlApiKey = process.argv[7] || process.env.FIRECRAWL_API_KEY;
  const googleCustomSearchApiKey = process.argv[8] || process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const googleCustomSearchEngineId = process.argv[9] || process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
  
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              LOCAL INDICATORS AUDIT TEST                                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`🔍 Testing URL: ${url}`);
  console.log(`🏥 Clinic Name: ${clinicName}`);
  console.log(`📍 City: ${city}`);
  console.log(`🔑 Place ID: ${placeId || 'Not provided'}\n`);
  
  // Load environment variables
  loadEnvFile();
  
  // Check for API keys
  console.log('📋 API Keys Status:');
  console.log(`   Google API: ${googleApiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Firecrawl: ${firecrawlApiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Google Custom Search API: ${googleCustomSearchApiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Google Custom Search Engine ID: ${googleCustomSearchEngineId ? '✅ Set' : '❌ Missing'}`);
  console.log('');
  
  console.log('🚀 Starting Local Indicators audit...\n');
  const startTime = Date.now();
  
  try {
    const result = await analyzeLocalIndicators(
      url,
      placeId,
      googleApiKey,
      city,
      clinicName,
      firecrawlApiKey,
      googleCustomSearchApiKey,
      googleCustomSearchEngineId,
    );
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ Audit completed in ${duration}s\n`);
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');
    
    // Detailed analysis
    console.log('📊 DETAILED RESULTS ANALYSIS\n');
    
    // 6.1. Google Business Profile
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('6.1. Google Business Profile (Completeness)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Completeness: ${result.google_business_profile.completeness_percent}%`);
    console.log(`   Fields filled: ${result.google_business_profile.filled_fields_count} / ${result.google_business_profile.total_fields_count}`);
    console.log(`   Photos: ${result.google_business_profile.photos_count} total, ${result.google_business_profile.high_quality_photos_count} high-quality`);
    console.log(`   Services: ${result.google_business_profile.services_count}`);
    console.log(`   Categories: ${result.google_business_profile.categories_count}`);
    console.log(`   Posts/month: ${result.google_business_profile.posts_per_month.toFixed(1)}`);
    console.log(`   Attributes: ${result.google_business_profile.attributes_count}`);
    console.log(`   Description: ${result.google_business_profile.has_description ? '✅' : '❌'}`);
    console.log(`   Business hours: ${result.google_business_profile.has_business_hours ? '✅' : '❌'}`);
    console.log(`   All days hours: ${result.google_business_profile.has_all_days_hours ? '✅' : '❌'}`);
    console.log(`   Q&A: ${result.google_business_profile.has_qa ? '✅' : '❌'}`);
    console.log(`   Photo types: exterior=${result.google_business_profile.has_exterior_photos ? '✅' : '❌'}, interior=${result.google_business_profile.has_interior_photos ? '✅' : '❌'}, team=${result.google_business_profile.has_team_photos ? '✅' : '❌'}, equipment=${result.google_business_profile.has_equipment_photos ? '✅' : '❌'}`);
    console.log('');
    
    // 6.2. Review Response
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('6.2. Реакція на відгуки (Review Response)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Total reviews: ${result.review_response.total_reviews}`);
    console.log(`   Responded: ${result.review_response.responded_reviews} (${result.review_response.response_rate_percent}%)`);
    console.log(`   Responded within 24h: ${result.review_response.responded_within_24h} (${result.review_response.response_rate_24h_percent}%)`);
    console.log(`   Average response time: ${result.review_response.average_response_time_hours?.toFixed(1) || 'N/A'} hours`);
    console.log(`   Negative reviews: ${result.review_response.negative_reviews_count}`);
    console.log(`   Negative responded: ${result.review_response.negative_reviews_responded} (${result.review_response.negative_response_rate_percent}%)`);
    console.log(`   Platforms:`);
    result.review_response.platforms.forEach((platform) => {
      console.log(`     - ${platform.platform}: ${platform.responded_reviews}/${platform.total_reviews} (${platform.response_rate_percent}%)`);
    });
    console.log('');
    
    // 6.3. GBP Engagement
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('6.3. Взаємодія з Google Business Profile (Engagement)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Impressions/month: ${result.gbp_engagement.impressions_per_month.toLocaleString()}`);
    console.log(`     - Search: ${result.gbp_engagement.search_impressions.toLocaleString()}`);
    console.log(`     - Maps: ${result.gbp_engagement.maps_impressions.toLocaleString()}`);
    console.log(`   Website clicks/month: ${result.gbp_engagement.website_clicks_per_month.toLocaleString()}`);
    console.log(`   Calls/month: ${result.gbp_engagement.calls_per_month.toLocaleString()}`);
    console.log(`   Direction requests/month: ${result.gbp_engagement.direction_requests_per_month.toLocaleString()}`);
    console.log(`   Photo views/month: ${result.gbp_engagement.photo_views_per_month?.toLocaleString() || 'N/A'}`);
    console.log(`   Bookings/month: ${result.gbp_engagement.bookings_per_month?.toLocaleString() || 'N/A'}`);
    console.log(`   CTR: ${result.gbp_engagement.ctr_percent.toFixed(1)}%`);
    console.log('');
    
    // 6.4. Local Backlinks
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('6.4. Local Backlinks');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Total local backlinks: ${result.local_backlinks.total_local_backlinks}`);
    console.log(`   Unique local domains: ${result.local_backlinks.unique_local_domains} ${result.local_backlinks.unique_local_domains >= 5 ? '✅ (>= 5 is good)' : '❌ (< 5 is bad)'}`);
    console.log(`   City: ${result.local_backlinks.city || 'Not specified'}`);
    console.log(`   By type:`);
    console.log(`     - City portals: ${result.local_backlinks.backlinks_by_type.city_portals}`);
    console.log(`     - News sites: ${result.local_backlinks.backlinks_by_type.news_sites}`);
    console.log(`     - Partners: ${result.local_backlinks.backlinks_by_type.partners}`);
    console.log(`     - Medical associations: ${result.local_backlinks.backlinks_by_type.medical_associations}`);
    console.log(`     - Charity foundations: ${result.local_backlinks.backlinks_by_type.charity_foundations}`);
    console.log(`     - Local bloggers: ${result.local_backlinks.backlinks_by_type.local_bloggers}`);
    console.log(`   Backlinks found: ${result.local_backlinks.backlinks.length}`);
    if (result.local_backlinks.backlinks.length > 0) {
      console.log(`   Sample backlinks:`);
      result.local_backlinks.backlinks.slice(0, 5).forEach((backlink, idx) => {
        console.log(`     ${idx + 1}. ${backlink.domain} (${backlink.type}) - ${backlink.url}`);
      });
    }
    console.log('');
    
    // 6.5. Local Social Media
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('6.5. Активність у локальних соцмережах (Local Social Media)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Facebook:`);
    console.log(`     - Profile exists: ${result.local_social_media.facebook.has_profile ? '✅' : '❌'}`);
    console.log(`     - Correct NAP: ${result.local_social_media.facebook.has_correct_nap ? '✅' : '❌'}`);
    console.log(`     - Geotags: ${result.local_social_media.facebook.has_geotags ? '✅' : '❌'}`);
    console.log(`     - City mentions: ${result.local_social_media.facebook.has_city_mentions ? '✅' : '❌'}`);
    console.log(`     - Local events posts: ${result.local_social_media.facebook.posts_about_local_events}`);
    console.log(`     - Local audience interaction: ${result.local_social_media.facebook.interaction_with_local_audience ? '✅' : '❌'}`);
    console.log(`   Instagram:`);
    console.log(`     - Profile exists: ${result.local_social_media.instagram.has_profile ? '✅' : '❌'}`);
    console.log(`     - Correct NAP: ${result.local_social_media.instagram.has_correct_nap ? '✅' : '❌'}`);
    console.log(`     - Geotags: ${result.local_social_media.instagram.has_geotags ? '✅' : '❌'}`);
    console.log(`     - City mentions: ${result.local_social_media.instagram.has_city_mentions ? '✅' : '❌'}`);
    console.log(`     - Local events posts: ${result.local_social_media.instagram.posts_about_local_events}`);
    console.log(`     - Local audience interaction: ${result.local_social_media.instagram.interaction_with_local_audience ? '✅' : '❌'}`);
    console.log('');
    
    // 6.6. Local Business Schema
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('6.6. Local Business Schema');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Implemented: ${result.local_business_schema.is_implemented ? '✅' : '❌'}`);
    console.log(`   Functioning correctly: ${result.local_business_schema.is_functioning_correctly ? '✅' : '❌'}`);
    console.log(`   Schema type: ${result.local_business_schema.schema_type || 'N/A'}`);
    console.log(`   Required fields:`);
    console.log(`     - Name: ${result.local_business_schema.has_name ? '✅' : '❌'}`);
    console.log(`     - Address: ${result.local_business_schema.has_address ? '✅' : '❌'}`);
    console.log(`     - Phone: ${result.local_business_schema.has_phone ? '✅' : '❌'}`);
    console.log(`     - Hours: ${result.local_business_schema.has_hours ? '✅' : '❌'}`);
    console.log(`   Optional fields:`);
    console.log(`     - Price range: ${result.local_business_schema.has_price_range ? '✅' : '❌'}`);
    console.log(`     - Aggregate rating: ${result.local_business_schema.has_aggregate_rating ? '✅' : '❌'}`);
    console.log(`   Validation status: ${result.local_business_schema.validation_status || 'N/A'}`);
    if (result.local_business_schema.schema_errors && result.local_business_schema.schema_errors.length > 0) {
      console.log(`   Errors: ${result.local_business_schema.schema_errors.length}`);
      result.local_business_schema.schema_errors.forEach((error) => {
        console.log(`     - ${error}`);
      });
    }
    if (result.local_business_schema.schema_warnings && result.local_business_schema.schema_warnings.length > 0) {
      console.log(`   Warnings: ${result.local_business_schema.schema_warnings.length}`);
      result.local_business_schema.schema_warnings.forEach((warning) => {
        console.log(`     - ${warning}`);
      });
    }
    console.log('');
    
    // Recommendations
    if (result.recommendations.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Recommendations');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      result.recommendations.forEach((rec, idx) => {
        console.log(`   ${idx + 1}. ${rec}`);
      });
      console.log('');
    }
    
    // Summary
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');
    console.log('📊 SUMMARY\n');
    console.log(`   Overall Score: ${calculateOverallScore(result)}/100`);
    console.log(`   Google Business Profile: ${result.google_business_profile.completeness_percent}%`);
    console.log(`   Review Response (24h): ${result.review_response.response_rate_24h_percent}%`);
    console.log(`   GBP Engagement CTR: ${result.gbp_engagement.ctr_percent.toFixed(1)}%`);
    console.log(`   Local Backlinks: ${result.local_backlinks.unique_local_domains} unique domains ${result.local_backlinks.unique_local_domains >= 5 ? '✅' : '❌'}`);
    console.log(`   Social Media: ${(result.local_social_media.facebook.has_profile && result.local_social_media.instagram.has_profile) ? 'Both profiles ✅' : result.local_social_media.facebook.has_profile || result.local_social_media.instagram.has_profile ? 'One profile ⚠️' : 'No profiles ❌'}`);
    console.log(`   Local Business Schema: ${result.local_business_schema.is_functioning_correctly ? 'Valid ✅' : result.local_business_schema.is_implemented ? 'Has errors ⚠️' : 'Not implemented ❌'}`);
    console.log('');
    
    // Export JSON for further analysis
    const outputPath = join(process.cwd(), 'local-indicators-result.json');
    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
    console.log(`💾 Full results saved to: ${outputPath}\n`);
    
  } catch {
    console.error('\n❌ Error during audit:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

function calculateOverallScore(result: typeof import('../lib/server/services/local/types').LocalIndicatorsAuditResult): number {
  const scores: number[] = [];
  
  scores.push(result.google_business_profile.completeness_percent);
  scores.push(result.review_response.response_rate_24h_percent);
  scores.push(result.gbp_engagement.ctr_percent);
  
  const backlinksScore = result.local_backlinks.unique_local_domains >= 5 
    ? 100 
    : (result.local_backlinks.unique_local_domains / 5) * 100;
  scores.push(backlinksScore);
  
  const socialScore = result.local_social_media.facebook.has_profile && result.local_social_media.instagram.has_profile
    ? 100
    : result.local_social_media.facebook.has_profile || result.local_social_media.instagram.has_profile
    ? 50
    : 0;
  scores.push(socialScore);
  
  const schemaScore = result.local_business_schema.is_functioning_correctly
    ? 100
    : result.local_business_schema.is_implemented
    ? 50
    : 0;
  scores.push(schemaScore);
  
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

main().catch(console.error);


