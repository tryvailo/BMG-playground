#!/usr/bin/env tsx

/**
 * Test script to explore Google PageSpeed Insights API response structure
 * 
 * Usage: tsx scripts/test-pagespeed-api.ts <url>
 * Example: tsx scripts/test-pagespeed-api.ts https://asparagus.one
 */

import { readFileSync } from 'fs';
import { join } from 'path';

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
          const cleanValue = value.replace(/^["']|["']$/g, '');
          process.env[key.trim()] = cleanValue;
        }
      }
    }
    console.log('✅ Loaded .env.local file');
  } catch (error) {
    console.warn('⚠️  Could not load .env.local file:', error);
  }
}

async function fetchPageSpeedFull(url: string, strategy: 'mobile' | 'desktop', apiKey: string) {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=${strategy}`;
  
  console.log(`\n🔍 Fetching PageSpeed ${strategy} data for: ${url}`);
  console.log(`📡 API URL: ${apiUrl.replace(apiKey, '***KEY***')}\n`);
  
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
    },
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Error: ${response.status} ${response.statusText}`);
    console.error(`Response: ${errorText}`);
    return null;
  }

  return await response.json();
}

async function main() {
  const url = process.argv[2] || 'https://asparagus.one';
  
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║           GOOGLE PAGESPEED INSIGHTS API - FULL RESPONSE ANALYSIS            ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  loadEnvFile();
  
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey) {
    console.error('❌ GOOGLE_PAGESPEED_API_KEY not found in environment');
    process.exit(1);
  }
  
  console.log(`📍 Testing URL: ${url}\n`);
  
  // Fetch both desktop and mobile
  const [desktopData, mobileData] = await Promise.all([
    fetchPageSpeedFull(url, 'desktop', apiKey),
    fetchPageSpeedFull(url, 'mobile', apiKey),
  ]);
  
  if (!desktopData || !mobileData) {
    console.error('❌ Failed to fetch PageSpeed data');
    process.exit(1);
  }
  
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                          RESPONSE STRUCTURE                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  // Analyze structure
  const analyzeResponse = (data: any, label: string) => {
    console.log(`\n📊 ${label.toUpperCase()} ANALYSIS:`);
    console.log('─'.repeat(80));
    
    // Top-level keys
    console.log('\n🔑 Top-level keys:');
    console.log(Object.keys(data).join(', '));
    
    // Categories
    if (data.lighthouseResult?.categories) {
      console.log('\n📈 Categories:');
      const categories = data.lighthouseResult.categories;
      Object.keys(categories).forEach((key) => {
        const cat = categories[key];
        const score = cat.score !== null && cat.score !== undefined 
          ? Math.round(cat.score * 100) 
          : 'N/A';
        console.log(`   ${key}: ${score}/100`);
      });
    }
    
    // Core Web Vitals
    if (data.lighthouseResult?.audits) {
      console.log('\n⚡ Core Web Vitals & Performance Metrics:');
      const audits = data.lighthouseResult.audits;
      
      const importantMetrics = [
        'largest-contentful-paint',
        'first-contentful-paint',
        'cumulative-layout-shift',
        'total-blocking-time',
        'speed-index',
        'interactive',
        'server-response-time',
        'first-meaningful-paint',
        'time-to-first-byte',
      ];
      
      importantMetrics.forEach((metric) => {
        const audit = audits[metric];
        if (audit) {
          const value = audit.numericValue !== undefined ? audit.numericValue : audit.score;
          const unit = audit.numericUnit || '';
          const displayValue = typeof value === 'number' 
            ? value.toFixed(2) 
            : value;
          console.log(`   ${metric}: ${displayValue} ${unit}`);
        }
      });
    }
    
    // Opportunities (recommendations)
    if (data.lighthouseResult?.audits) {
      console.log('\n💡 Opportunities (Top 10):');
      const audits = data.lighthouseResult.audits;
      const opportunities: Array<{ id: string; score: number | null; details: any }> = [];
      
      Object.keys(audits).forEach((key) => {
        const audit = audits[key];
        if (audit.score !== null && audit.score !== undefined && audit.score < 1) {
          opportunities.push({
            id: key,
            score: audit.score,
            details: audit,
          });
        }
      });
      
      opportunities
        .sort((a, b) => {
          const aScore = a.score ?? 1;
          const bScore = b.score ?? 1;
          return aScore - bScore;
        })
        .slice(0, 10)
        .forEach((opp) => {
          const score = opp.score !== null ? Math.round(opp.score * 100) : 'N/A';
          const title = opp.details.title || opp.id;
          console.log(`   [${score}/100] ${title}`);
        });
    }
    
    // Diagnostics
    if (data.lighthouseResult?.audits) {
      console.log('\n🔍 Diagnostics (Top 5):');
      const audits = data.lighthouseResult.audits;
      const diagnostics: Array<{ id: string; details: any }> = [];
      
      Object.keys(audits).forEach((key) => {
        const audit = audits[key];
        // Diagnostics typically have score: null and are informational
        if (audit.score === null && audit.details?.type === 'table') {
          diagnostics.push({
            id: key,
            details: audit,
          });
        }
      });
      
      diagnostics.slice(0, 5).forEach((diag) => {
        const title = diag.details.title || diag.id;
        console.log(`   • ${title}`);
      });
    }
  };
  
  analyzeResponse(desktopData, 'Desktop');
  analyzeResponse(mobileData, 'Mobile');
  
  // Compare Desktop vs Mobile
  console.log('\n\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    DESKTOP vs MOBILE COMPARISON                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  const desktopScore = desktopData.lighthouseResult?.categories?.performance?.score;
  const mobileScore = mobileData.lighthouseResult?.categories?.performance?.score;
  
  console.log(`Performance Score:`);
  console.log(`   Desktop: ${desktopScore !== null ? Math.round(desktopScore * 100) : 'N/A'}/100`);
  console.log(`   Mobile:  ${mobileScore !== null ? Math.round(mobileScore * 100) : 'N/A'}/100`);
  
  // Core Web Vitals comparison
  const compareMetric = (name: string, desktopAudit: any, mobileAudit: any) => {
    const desktopValue = desktopAudit?.numericValue;
    const mobileValue = mobileAudit?.numericValue;
    const unit = desktopAudit?.numericUnit || mobileAudit?.numericUnit || '';
    
    if (desktopValue !== undefined || mobileValue !== undefined) {
      console.log(`\n${name}:`);
      console.log(`   Desktop: ${desktopValue !== undefined ? desktopValue.toFixed(2) : 'N/A'} ${unit}`);
      console.log(`   Mobile:  ${mobileValue !== undefined ? mobileValue.toFixed(2) : 'N/A'} ${unit}`);
    }
  };
  
  const desktopAudits = desktopData.lighthouseResult?.audits || {};
  const mobileAudits = mobileData.lighthouseResult?.audits || {};
  
  compareMetric('LCP (Largest Contentful Paint)', desktopAudits['largest-contentful-paint'], mobileAudits['largest-contentful-paint']);
  compareMetric('FCP (First Contentful Paint)', desktopAudits['first-contentful-paint'], mobileAudits['first-contentful-paint']);
  compareMetric('CLS (Cumulative Layout Shift)', desktopAudits['cumulative-layout-shift'], mobileAudits['cumulative-layout-shift']);
  compareMetric('TBT (Total Blocking Time)', desktopAudits['total-blocking-time'], mobileAudits['total-blocking-time']);
  compareMetric('Speed Index', desktopAudits['speed-index'], mobileAudits['speed-index']);
  
  // Full JSON output
  console.log('\n\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                          FULL JSON RESPONSE                                   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('📄 Desktop Response (first 2000 chars):');
  console.log(JSON.stringify(desktopData, null, 2).substring(0, 2000));
  console.log('\n... (truncated) ...\n');
  
  console.log('📄 Mobile Response (first 2000 chars):');
  console.log(JSON.stringify(mobileData, null, 2).substring(0, 2000));
  console.log('\n... (truncated) ...\n');
  
  // Save full responses to files
  const fs = await import('fs');
  fs.writeFileSync('pagespeed-desktop-response.json', JSON.stringify(desktopData, null, 2));
  fs.writeFileSync('pagespeed-mobile-response.json', JSON.stringify(mobileData, null, 2));
  console.log('💾 Full responses saved to:');
  console.log('   - pagespeed-desktop-response.json');
  console.log('   - pagespeed-mobile-response.json');
}

main().catch(console.error);

