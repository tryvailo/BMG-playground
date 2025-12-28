/**
 * Debug script to analyze Schema.org data extraction
 * 
 * This script runs a technical audit and provides detailed logging
 * to identify where Schema.org data is lost.
 */

import { performEphemeralTechAudit } from '../lib/modules/audit/ephemeral-audit';
import { parseHtml } from '../lib/modules/audit/utils/html-parser';

// Test URL - можно изменить на любой сайт для тестирования
const TEST_URL = process.argv[2] || 'https://example.com';
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const PAGESPEED_KEY = process.env.GOOGLE_PAGESPEED_API_KEY;

async function debugSchemaAnalysis() {
  console.log('='.repeat(80));
  console.log('🔍 DEBUG: Schema.org Data Analysis');
  console.log('='.repeat(80));
  console.log(`\n📋 Test URL: ${TEST_URL}\n`);

  try {
    // Step 1: Fetch HTML directly
    console.log('📥 Step 1: Fetching HTML...');
    const htmlResponse = await fetch(TEST_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!htmlResponse.ok) {
      console.error(`❌ Failed to fetch HTML: ${htmlResponse.status} ${htmlResponse.statusText}`);
      return;
    }

    const html = await htmlResponse.text();
    console.log(`✅ HTML fetched: ${html.length} characters\n`);

    // Step 2: Parse HTML and extract schema
    console.log('🔍 Step 2: Parsing HTML and extracting schema...');
    const parseResult = await parseHtml(html, TEST_URL);
    
    console.log('\n📊 Parse Result Schema Data:');
    console.log(JSON.stringify(parseResult.schema, null, 2));
    console.log('\n');

    // Step 3: Check for JSON-LD blocks manually
    console.log('🔍 Step 3: Manual JSON-LD analysis...');
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    
    if (!jsonLdMatches || jsonLdMatches.length === 0) {
      console.log('⚠️  No JSON-LD script tags found in HTML');
    } else {
      console.log(`✅ Found ${jsonLdMatches.length} JSON-LD script tag(s)\n`);
      
      jsonLdMatches.forEach((match, index) => {
        console.log(`\n📦 JSON-LD Block #${index + 1}:`);
        const contentMatch = match.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        if (contentMatch && contentMatch[1]) {
          const content = contentMatch[1].trim();
          console.log(`   Length: ${content.length} characters`);
          console.log(`   Preview: ${content.substring(0, 200)}...`);
          
          try {
            const parsed = JSON.parse(content);
            console.log(`   ✅ Valid JSON`);
            console.log(`   Type: ${JSON.stringify(parsed['@type'] || parsed.type || 'unknown')}`);
            
            // Check for @graph
            if (parsed['@graph']) {
              console.log(`   📊 Contains @graph with ${parsed['@graph'].length} items`);
            }
          } catch (_error) {
            console.log(`   ❌ Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      });
    }

    // Step 4: Run full audit
    console.log('\n' + '='.repeat(80));
    console.log('🔍 Step 4: Running full technical audit...');
    console.log('='.repeat(80) + '\n');

    const auditResult = await performEphemeralTechAudit(
      TEST_URL,
      OPENAI_KEY,
      PAGESPEED_KEY,
    );

    // Step 5: Compare results
    console.log('\n' + '='.repeat(80));
    console.log('📊 Step 5: Comparing Results');
    console.log('='.repeat(80) + '\n');

    console.log('📋 Direct Parse Result Schema:');
    console.log(JSON.stringify(parseResult.schema, null, 2));
    console.log('\n');

    console.log('📋 Audit Result Schema:');
    console.log(JSON.stringify(auditResult.schema, null, 2));
    console.log('\n');

    // Step 6: Analysis
    console.log('='.repeat(80));
    console.log('🔍 Analysis');
    console.log('='.repeat(80) + '\n');

    const directSchema = parseResult.schema;
    const auditSchema = auditResult.schema;

    console.log('Direct Parse vs Audit Result:');
    console.log(`  hasMedicalOrganization: ${directSchema.hasMedicalOrganization} → ${auditSchema.hasMedicalOrg}`);
    console.log(`  hasLocalBusiness: ${directSchema.hasLocalBusiness} → ${auditSchema.hasLocalBusiness}`);
    console.log(`  hasPhysician: ${directSchema.hasPhysician} → ${auditSchema.hasPhysician}`);
    console.log(`  hasMedicalProcedure: ${directSchema.hasMedicalProcedure} → ${auditSchema.hasMedicalProcedure}`);
    console.log(`  hasMedicalSpecialty: ${directSchema.hasMedicalSpecialty} → ${auditSchema.hasMedicalSpecialty}`);
    console.log(`  hasFAQPage: ${directSchema.hasFAQPage} → ${auditSchema.hasFAQPage}`);
    console.log(`  hasReview: ${directSchema.hasReview} → ${auditSchema.hasReview}`);
    console.log(`  hasBreadcrumbList: ${directSchema.hasBreadcrumbList} → ${auditSchema.hasBreadcrumbList}`);

    // Check if htmlData is null
    if (!auditResult.schema || Object.values(auditResult.schema).every(v => v === false)) {
      console.log('\n⚠️  WARNING: All schema values are false or missing!');
      console.log('   This suggests htmlData might be null or schema extraction failed.');
    }

  } catch (_error) {
    console.error('\n❌ Error during analysis:');
    console.error(error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run the analysis
debugSchemaAnalysis()
  .then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });


