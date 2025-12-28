#!/usr/bin/env tsx

/**
 * Script to run Technical Audit locally in terminal
 * 
 * Usage: tsx scripts/run-tech-audit.ts <url> [openai-key] [pagespeed-key] [firecrawl-key]
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { performEphemeralTechAudit } from '../lib/modules/audit/ephemeral-audit';

// Load environment variables from .env.local
try {
  const envPath = resolve(__dirname, '../.env.local');
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
} catch (_error) {
  // .env.local might not exist, continue without it
}

// Get URL from command line arguments
const url = process.argv[2];
// Try to get OpenAI key from: command line arg -> env var -> .env.local (already loaded)
const openaiKey = process.argv[3] || process.env.OPENAI_API_KEY || '';
const pageSpeedKey = process.argv[4] || process.env.GOOGLE_PAGESPEED_API_KEY || '';
const firecrawlKey = process.argv[5] || process.env.FIRECRAWL_API_KEY || '';

if (!url) {
  console.error('❌ Error: URL is required');
  console.log('\nUsage: tsx scripts/run-tech-audit.ts <url> [openai-key] [pagespeed-key] [firecrawl-key]');
  console.log('\nExample:');
  console.log('  tsx scripts/run-tech-audit.ts https://adonis.com.ua/uk/');
  console.log('\nNote: API keys can be provided as arguments or set in .env.local file');
  process.exit(1);
}

if (!openaiKey) {
  console.warn('⚠️  Warning: OpenAI API key not provided. llms.txt analysis will be skipped.');
  console.warn('   Set OPENAI_API_KEY in .env.local or pass as second argument.');
} else {
  console.log('✅ OpenAI API key found (will be used for llms.txt analysis)');
}

if (!pageSpeedKey) {
  console.warn('⚠️  Warning: Google PageSpeed API key not provided. Speed scores will be skipped.');
}

console.log('\n🔍 Starting Technical Audit...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📍 Target URL: ${url}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const startTime = Date.now();

try {
  const result = await performEphemeralTechAudit(url, openaiKey, pageSpeedKey);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n✅ Audit completed successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 AUDIT RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Performance Scores
  console.log('🚀 PERFORMANCE SCORES');
  console.log('────────────────────────────────────────────────────────────────────────────────');
  console.log(`Desktop Speed:    ${result.speed.desktop !== null ? `✅ ${result.speed.desktop}/100` : '❌ Not available'}`);
  console.log(`Mobile Speed:     ${result.speed.mobile !== null ? `✅ ${result.speed.mobile}/100` : '❌ Not available'}`);
  console.log('────────────────────────────────────────────────────────────────────────────────\n');

  // Security & Mobile
  console.log('🔒 SECURITY & MOBILE');
  console.log('────────────────────────────────────────────────────────────────────────────────');
  console.log(`HTTPS Enabled:    ${result.security.https ? '✅ Yes' : '❌ No'}`);
  console.log(`Mobile Friendly:  ${result.security.mobileFriendly ? '✅ Yes' : '❌ No'}`);
  console.log('────────────────────────────────────────────────────────────────────────────────\n');

  // Core Files
  console.log('📁 CORE FILES');
  console.log('────────────────────────────────────────────────────────────────────────────────');
  console.log(`robots.txt:       ${result.files.robots ? '✅ Present' : '❌ Missing'}`);
  console.log(`sitemap.xml:      ${result.files.sitemap ? '✅ Present' : '❌ Missing'}`);
  console.log(`llms.txt:         ${result.files.llmsTxt.present ? '✅ Present' : '❌ Missing'}`);
  if (result.files.llmsTxt.present) {
    console.log(`  └─ Score:       ${result.files.llmsTxt.score}/100`);
    console.log(`  └─ Recommendations: ${result.files.llmsTxt.recommendations.length} items`);
    if (result.files.llmsTxt.recommendations.length > 0) {
      result.files.llmsTxt.recommendations.forEach((rec, idx) => {
        console.log(`     ${idx + 1}. ${rec}`);
      });
    }
  }
  console.log('────────────────────────────────────────────────────────────────────────────────\n');

  // Schema Markup
  console.log('🏷️  SCHEMA MARKUP');
  console.log('────────────────────────────────────────────────────────────────────────────────');
  console.log(`Medical Organization: ${result.schema.hasMedicalOrg ? '✅' : '❌'}`);
  console.log(`Physician:            ${result.schema.hasPhysician ? '✅' : '❌'}`);
  console.log(`Medical Procedure:    ${result.schema.hasMedicalProcedure ? '✅' : '❌'}`);
  console.log(`Local Business:       ${result.schema.hasLocalBusiness ? '✅' : '❌'}`);
  console.log(`FAQ Page:            ${result.schema.hasFAQ ? '✅' : '❌'}`);
  console.log(`Reviews:             ${result.schema.hasReviews ? '✅' : '❌'}`);
  console.log('────────────────────────────────────────────────────────────────────────────────\n');

  // Meta Tags
  console.log('📝 META TAGS');
  console.log('────────────────────────────────────────────────────────────────────────────────');
  console.log(`Title:       ${result.meta.title || '❌ Missing'}`);
  console.log(`Description: ${result.meta.description || '❌ Missing'}`);
  console.log('────────────────────────────────────────────────────────────────────────────────\n');

  // External Links (if available from HTML parsing)
  // Note: This data comes from parseHtml which is async and may not be in the result
  // We'll check if it exists in the raw data

  // Duplicate Prevention
  console.log('🔄 DUPLICATE PREVENTION');
  console.log('────────────────────────────────────────────────────────────────────────────────');
  console.log(`WWW Redirect:      ${result.duplicates.wwwRedirect === 'ok' ? '✅ OK' : result.duplicates.wwwRedirect === 'duplicate' ? '⚠️  Duplicate' : '❌ Error'}`);
  console.log(`Trailing Slash:    ${result.duplicates.trailingSlash === 'ok' ? '✅ OK' : result.duplicates.trailingSlash === 'duplicate' ? '⚠️  Duplicate' : '❌ Error'}`);
  console.log(`HTTP → HTTPS:      ${result.duplicates.httpRedirect === 'ok' ? '✅ OK' : result.duplicates.httpRedirect === 'duplicate' ? '⚠️  Duplicate' : '❌ Error'}`);
  console.log('────────────────────────────────────────────────────────────────────────────────\n');

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const scores = [];
  if (result.speed.desktop !== null) scores.push(result.speed.desktop);
  if (result.speed.mobile !== null) scores.push(result.speed.mobile);
  const avgSpeed = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  
  const issues: string[] = [];
  if (!result.security.https) issues.push('HTTPS not enabled');
  if (!result.security.mobileFriendly) issues.push('Not mobile friendly');
  if (!result.files.robots) issues.push('Missing robots.txt');
  if (!result.files.sitemap) issues.push('Missing sitemap.xml');
  if (!result.files.llmsTxt.present) issues.push('Missing llms.txt');
  if (result.duplicates.wwwRedirect === 'duplicate') issues.push('WWW duplicate issue');
  if (result.duplicates.trailingSlash === 'duplicate') issues.push('Trailing slash duplicate');
  if (result.duplicates.httpRedirect === 'duplicate') issues.push('HTTP/HTTPS duplicate');
  
  console.log(`Average Speed Score: ${avgSpeed !== null ? `${avgSpeed.toFixed(1)}/100` : 'N/A'}`);
  console.log(`LLMS.txt Score:      ${result.files.llmsTxt.present ? `${result.files.llmsTxt.score}/100` : 'N/A (file missing)'}`);
  console.log(`Issues Found:        ${issues.length} ${issues.length > 0 ? '⚠️' : '✅'}`);
  
  if (issues.length > 0) {
    console.log('\n⚠️  Issues:');
    issues.forEach((issue, idx) => {
      console.log(`   ${idx + 1}. ${issue}`);
    });
  }
  
  console.log(`\n⏱️  Audit Duration: ${duration}s`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Raw JSON output
  console.log('📋 RAW JSON DATA');
  console.log('────────────────────────────────────────────────────────────────────────────────');
  console.log(JSON.stringify(result, null, 2));
  console.log('────────────────────────────────────────────────────────────────────────────────\n');

} catch (_error) {
  console.error('\n❌ Error during audit:', error);
  if (error instanceof Error) {
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}

