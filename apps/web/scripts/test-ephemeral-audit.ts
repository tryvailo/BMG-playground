#!/usr/bin/env tsx

/**
 * Test script for ephemeral technical audit
 * 
 * Usage: tsx scripts/test-ephemeral-audit.ts <url>
 * Example: tsx scripts/test-ephemeral-audit.ts https://adonis.com.ua
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { performEphemeralTechAudit } from '../lib/modules/audit/ephemeral-audit';

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          // Remove quotes if present
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
  const url = process.argv[2] || 'https://adonis.com.ua';
  
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              EPHEMERAL TECHNICAL AUDIT TEST                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`🔍 Testing URL: ${url}\n`);
  
  // Load environment variables
  loadEnvFile();
  
  // Check for required API keys
  const openaiKey = process.env.OPENAI_API_KEY;
  const pageSpeedKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  
  console.log('📋 API Keys Status:');
  console.log(`   OpenAI: ${openaiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   PageSpeed: ${pageSpeedKey ? '✅ Set' : '❌ Missing'}`);
  console.log('');
  
  if (!openaiKey) {
    console.warn('⚠️  Warning: OPENAI_API_KEY not set. llms.txt analysis will be skipped.');
  }
  
  if (!pageSpeedKey) {
    console.warn('⚠️  Warning: GOOGLE_PAGESPEED_API_KEY not set. PageSpeed checks will be skipped.');
  }
  
  console.log('🚀 Starting technical audit...\n');
  const startTime = Date.now();
  
  try {
    const result = await performEphemeralTechAudit(url, openaiKey || '', pageSpeedKey);
    const duration = Date.now() - startTime;
    
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                          AUDIT RESULTS                                      ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
    
    // Speed Results
    console.log('📊 PERFORMANCE METRICS:');
    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log(`   Desktop Speed: ${result.speed.desktop !== null ? `${result.speed.desktop}/100 ✅` : 'N/A ❌'}`);
    console.log(`   Mobile Speed:  ${result.speed.mobile !== null ? `${result.speed.mobile}/100 ✅` : 'N/A ❌'}`);
    
    // Detailed metrics if available
    if (result.speed.desktopDetails) {
      console.log('\n   📈 Desktop Details:');
      const d = result.speed.desktopDetails;
      if (d.lcp !== null) console.log(`      LCP: ${d.lcp.toFixed(0)}ms`);
      if (d.fcp !== null) console.log(`      FCP: ${d.fcp.toFixed(0)}ms`);
      if (d.cls !== null) console.log(`      CLS: ${d.cls.toFixed(3)}`);
      if (d.tbt !== null) console.log(`      TBT: ${d.tbt.toFixed(0)}ms`);
      if (d.si !== null) console.log(`      Speed Index: ${d.si.toFixed(0)}ms`);
      if (d.tti !== null) console.log(`      TTI: ${d.tti.toFixed(0)}ms`);
      if (d.ttfb !== null) console.log(`      TTFB: ${d.ttfb.toFixed(0)}ms`);
      if (d.opportunities.length > 0) {
        console.log(`      Top Opportunities: ${d.opportunities.length} recommendations`);
      }
      if (d.categories.performance !== null) console.log(`      Performance: ${d.categories.performance}/100`);
      if (d.categories.accessibility !== null) console.log(`      Accessibility: ${d.categories.accessibility}/100`);
      if (d.categories.bestPractices !== null) console.log(`      Best Practices: ${d.categories.bestPractices}/100`);
      if (d.categories.seo !== null) console.log(`      SEO: ${d.categories.seo}/100`);
    }
    
    if (result.speed.mobileDetails) {
      console.log('\n   📱 Mobile Details:');
      const m = result.speed.mobileDetails;
      if (m.lcp !== null) console.log(`      LCP: ${m.lcp.toFixed(0)}ms`);
      if (m.fcp !== null) console.log(`      FCP: ${m.fcp.toFixed(0)}ms`);
      if (m.cls !== null) console.log(`      CLS: ${m.cls.toFixed(3)}`);
      if (m.tbt !== null) console.log(`      TBT: ${m.tbt.toFixed(0)}ms`);
      if (m.si !== null) console.log(`      Speed Index: ${m.si.toFixed(0)}ms`);
      if (m.opportunities.length > 0) {
        console.log(`      Top Opportunities: ${m.opportunities.length} recommendations`);
      }
    }
    console.log('');
    
    // Security
    console.log('🔒 SECURITY & ACCESS:');
    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log(`   HTTPS:          ${result.security.https ? '✅ Enabled' : '❌ Not enabled'}`);
    console.log(`   Mobile Friendly: ${result.security.mobileFriendly ? '✅ Yes' : '❌ No'}`);
    console.log('');
    
    // Files
    console.log('📁 CORE FILES:');
    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log(`   robots.txt:     ${result.files.robots ? '✅ Found' : '❌ Missing'}`);
    console.log(`   sitemap.xml:    ${result.files.sitemap ? '✅ Found' : '❌ Missing'}`);
    console.log(`   llms.txt:       ${result.files.llmsTxt.present ? '✅ Found' : '❌ Missing'}`);
    if (result.files.llmsTxt.present) {
      console.log(`   LLMS.txt Score:  ${result.files.llmsTxt.score}/100`);
      if (result.files.llmsTxt.recommendations.length > 0) {
        console.log(`   Recommendations: ${result.files.llmsTxt.recommendations.length} items`);
      }
    }
    console.log('');
    
    // Schema
    console.log('🏗️  SCHEMA MARKUP:');
    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log(`   Medical Organization: ${result.schema.hasMedicalOrg ? '✅' : '❌'}`);
    console.log(`   Physician:            ${result.schema.hasPhysician ? '✅' : '❌'}`);
    console.log(`   Medical Procedure:    ${result.schema.hasMedicalProcedure ? '✅' : '❌'}`);
    console.log(`   Local Business:       ${result.schema.hasLocalBusiness ? '✅' : '❌'}`);
    console.log(`   FAQ Page:             ${result.schema.hasFAQ ? '✅' : '❌'}`);
    console.log(`   Reviews:              ${result.schema.hasReviews ? '✅' : '❌'}`);
    console.log('');
    
    // Meta Tags
    console.log('📝 META TAGS:');
    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log(`   Title:       ${result.meta.title ? `✅ "${result.meta.title.substring(0, 60)}${result.meta.title.length > 60 ? '...' : ''}" (${result.meta.title.length} chars)` : '❌ Missing'}`);
    console.log(`   Description: ${result.meta.description ? `✅ "${result.meta.description.substring(0, 80)}${result.meta.description.length > 80 ? '...' : ''}" (${result.meta.description.length} chars)` : '❌ Missing'}`);
    console.log('');
    
    // Duplicates
    console.log('🔗 DUPLICATE PREVENTION:');
    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log(`   WWW Redirect:    ${result.duplicates.wwwRedirect === 'ok' ? '✅' : result.duplicates.wwwRedirect === 'duplicate' ? '⚠️  Duplicate' : '❌ Error'}`);
    console.log(`   Trailing Slash:  ${result.duplicates.trailingSlash === 'ok' ? '✅' : result.duplicates.trailingSlash === 'duplicate' ? '⚠️  Duplicate' : '❌ Error'}`);
    console.log(`   HTTP → HTTPS:    ${result.duplicates.httpRedirect === 'ok' ? '✅' : result.duplicates.httpRedirect === 'duplicate' ? '⚠️  Duplicate' : '❌ Error'}`);
    console.log('');
    
    // Summary
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                              SUMMARY                                         ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
    console.log(`⏱️  Total Duration: ${(duration / 1000).toFixed(2)}s\n`);
    
    // Detailed PageSpeed errors
    if (result.speed.desktop === null || result.speed.mobile === null) {
      console.log('⚠️  PageSpeed API Issues:');
      if (result.speed.desktop === null) {
        console.log('   - Desktop speed check failed (timeout, API error, or missing key)');
      }
      if (result.speed.mobile === null) {
        console.log('   - Mobile speed check failed (timeout, API error, or missing key)');
      }
      console.log('');
    }
    
    // LLMS.txt recommendations
    if (result.files.llmsTxt.recommendations.length > 0) {
      console.log('💡 LLMS.txt Recommendations:');
      result.files.llmsTxt.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
      console.log('');
    }
    
    // Full JSON output
    console.log('📄 Full JSON Result:');
    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log(JSON.stringify(result, null, 2));
    console.log('');
    
  } catch {
    console.error('❌ Error running technical audit:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

main().catch(console.error);

