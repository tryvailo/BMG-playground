#!/usr/bin/env tsx

/**
 * Test script for llms.txt analysis
 * 
 * Usage: tsx scripts/test-llms-analysis.ts <url>
 * Example: tsx scripts/test-llms-analysis.ts https://complimed.com.ua
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { analyzeLlmsTxt } from '../lib/modules/audit/utils/llms-analyzer';

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
  } catch {
    console.warn('⚠️  Could not load .env.local file:', error);
  }
}

async function fetchLlmsTxt(url: string): Promise<string | null> {
  const llmsTxtUrl = url.endsWith('/llms.txt') ? url : `${url.replace(/\/$/, '')}/llms.txt`;
  
  console.log(`\n🔍 Fetching llms.txt from: ${llmsTxtUrl}\n`);
  
  try {
    const response = await fetch(llmsTxtUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const content = await response.text();
    return content;
  } catch {
    console.error('❌ Error fetching llms.txt:', error);
    return null;
  }
}

async function main() {
  const url = process.argv[2] || 'https://complimed.com.ua';
  
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    LLMS.TXT ANALYSIS TEST                                   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📍 Target URL: ${url}\n`);
  
  loadEnvFile();
  
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.warn('⚠️  OPENAI_API_KEY not found in environment');
    console.warn('   Analysis will be skipped, but file content will be shown.\n');
  }
  
  // Fetch llms.txt
  const llmsContent = await fetchLlmsTxt(url);
  
  if (!llmsContent) {
    console.error('❌ Failed to fetch llms.txt file');
    process.exit(1);
  }
  
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                          LLMS.TXT CONTENT                                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('📄 File Content:');
  console.log('─'.repeat(80));
  console.log(llmsContent);
  console.log('─'.repeat(80));
  console.log(`\n📊 File Stats:`);
  console.log(`   Size: ${llmsContent.length} characters`);
  console.log(`   Lines: ${llmsContent.split('\n').length}`);
  console.log(`   Words: ${llmsContent.split(/\s+/).filter(w => w.length > 0).length}\n`);
  
  // Analyze with AI
  let analysis = null;
  
  if (openaiKey) {
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                          AI ANALYSIS RESULTS                                 ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
    
    console.log('🤖 Analyzing with GPT-4o-mini...\n');
    
    try {
      analysis = await analyzeLlmsTxt(llmsContent, openaiKey);
    
      console.log('✅ Analysis completed!\n');
      console.log('─'.repeat(80));
      console.log(`📊 Score: ${analysis.score}/100`);
      console.log('─'.repeat(80));
      console.log(`\n📝 Summary:\n${analysis.summary}\n`);
      
      if (analysis.missing_sections.length > 0) {
        console.log('⚠️  Missing Sections:');
        analysis.missing_sections.forEach((section, idx) => {
          console.log(`   ${idx + 1}. ${section}`);
        });
        console.log('');
      } else {
        console.log('✅ No missing sections detected!\n');
      }
      
      if (analysis.recommendations.length > 0) {
        console.log('💡 Recommendations:');
        analysis.recommendations.forEach((rec, idx) => {
          console.log(`   ${idx + 1}. ${rec}`);
        });
        console.log('');
      }
    } catch {
      console.error('❌ Error during AI analysis:', error);
      console.log('⚠️  Continuing with structure analysis only...\n');
    }
  } else {
    console.log('⚠️  Skipping AI analysis (no OpenAI key)\n');
  }
  
  // Compare with real file structure
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    COMPARISON WITH REAL FILE                                ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  const hasMarkdown = llmsContent.includes('#') || llmsContent.includes('##');
  const hasTreasureUrls = /(about|services|doctors|contacts|контакти|лікарі|послуги)/i.test(llmsContent);
  const hasContactInfo = /(\+38|телефон|phone|адреса|address)/i.test(llmsContent);
  const hasDescriptions = llmsContent.length > 500;
  const hasLanguageSections = /##\s*Language:/i.test(llmsContent);
  const hasInstructions = /інструкції|instructions|для LLM/i.test(llmsContent);
  
  console.log('📋 File Structure Analysis:');
  console.log('─'.repeat(80));
  console.log(`   Markdown Structure:     ${hasMarkdown ? '✅ Yes' : '❌ No'}`);
  console.log(`   Treasure URLs:          ${hasTreasureUrls ? '✅ Yes' : '❌ No'}`);
  console.log(`   Contact Information:    ${hasContactInfo ? '✅ Yes' : '❌ No'}`);
  console.log(`   Detailed Descriptions:  ${hasDescriptions ? '✅ Yes' : '❌ No'}`);
  console.log(`   Language Sections:      ${hasLanguageSections ? '✅ Yes' : '❌ No'}`);
  console.log(`   LLM Instructions:       ${hasInstructions ? '✅ Yes' : '❌ No'}`);
  console.log('─'.repeat(80));
  
  // Extract specific sections
  const sections = {
    title: llmsContent.match(/^#\s*(.+)/m)?.[1] || null,
    defaultLanguage: llmsContent.match(/default_language:\s*(\w+)/i)?.[1] || null,
    site: llmsContent.match(/site:\s*(.+)/i)?.[1] || null,
    type: llmsContent.match(/type:\s*(.+)/i)?.[1] || null,
    city: llmsContent.match(/primary_city:\s*(.+)/i)?.[1] || null,
    languages: llmsContent.match(/##\s*Language:\s*(\w+)/gi)?.map(m => m.match(/\w+$/)?.[0]) || [],
  };
  
  console.log('\n📑 Extracted Metadata:');
  console.log('─'.repeat(80));
  if (sections.title) console.log(`   Title: ${sections.title}`);
  if (sections.defaultLanguage) console.log(`   Default Language: ${sections.defaultLanguage}`);
  if (sections.site) console.log(`   Site: ${sections.site}`);
  if (sections.type) console.log(`   Type: ${sections.type}`);
  if (sections.city) console.log(`   Primary City: ${sections.city}`);
  if (sections.languages.length > 0) {
    console.log(`   Languages: ${sections.languages.join(', ')}`);
  }
  console.log('─'.repeat(80));
  
  // Final comparison
  if (analysis) {
    console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                          FINAL ASSESSMENT                                   ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
    
    const aiScore = analysis.score;
    const structureScore = [
      hasMarkdown,
      hasTreasureUrls,
      hasContactInfo,
      hasDescriptions,
      hasLanguageSections,
      hasInstructions,
    ].filter(Boolean).length * (100 / 6);
    
    console.log(`AI Analysis Score:        ${aiScore}/100`);
    console.log(`Structure Analysis Score: ${Math.round(structureScore)}/100`);
    console.log(`Average Score:            ${Math.round((aiScore + structureScore) / 2)}/100\n`);
    
    if (aiScore >= 80) {
      console.log('✅ Excellent llms.txt file!');
    } else if (aiScore >= 60) {
      console.log('⚠️  Good llms.txt file, but has room for improvement.');
    } else {
      console.log('❌ llms.txt file needs significant improvements.');
    }
    
    console.log('\n📄 Full JSON Analysis Result:');
    console.log('─'.repeat(80));
    console.log(JSON.stringify(analysis, null, 2));
    console.log('─'.repeat(80));
  } else {
    console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    STRUCTURE ANALYSIS ONLY                                   ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
    
    const structureScore = [
      hasMarkdown,
      hasTreasureUrls,
      hasContactInfo,
      hasDescriptions,
      hasLanguageSections,
      hasInstructions,
    ].filter(Boolean).length * (100 / 6);
    
    console.log(`Structure Analysis Score: ${Math.round(structureScore)}/100\n`);
    
    if (structureScore >= 80) {
      console.log('✅ Excellent structure!');
    } else if (structureScore >= 60) {
      console.log('⚠️  Good structure, but has room for improvement.');
    } else {
      console.log('❌ Structure needs significant improvements.');
    }
  }
}

main().catch(console.error);
