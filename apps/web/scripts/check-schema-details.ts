#!/usr/bin/env tsx

/**
 * Check detailed Schema.org content from a website
 */

const url = process.argv[2] || 'https://complimed.com.ua';

async function checkSchemaDetails() {
  console.log('='.repeat(80));
  console.log('🔍 Detailed Schema.org Analysis');
  console.log('='.repeat(80));
  console.log(`\n📋 URL: ${url}\n`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
      },
    });

    if (!response.ok) {
      console.error(`❌ Failed to fetch: ${response.status}`);
      return;
    }

    const html = await response.text();
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

    if (!jsonLdMatches || jsonLdMatches.length === 0) {
      console.log('⚠️  No JSON-LD found');
      return;
    }

    console.log(`✅ Found ${jsonLdMatches.length} JSON-LD block(s)\n`);

    jsonLdMatches.forEach((match, index) => {
      const contentMatch = match.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      if (contentMatch && contentMatch[1]) {
        const content = contentMatch[1].trim();
        
        try {
          const parsed = JSON.parse(content);
          console.log(`\n📦 JSON-LD Block #${index + 1}:`);
          console.log('─'.repeat(80));
          
          // Handle @graph
          if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
            console.log(`📊 Contains @graph with ${parsed['@graph'].length} items:\n`);
            
            parsed['@graph'].forEach((item: Record<string, unknown>, i: number) => {
              console.log(`  Item ${i + 1}:`);
              const type = item['@type'] || item.type;
              console.log(`    Type: ${JSON.stringify(type)}`);
              console.log(`    ID: ${item['@id'] || 'N/A'}`);
              
              if (item.name) console.log(`    Name: ${item.name}`);
              if (item.url) console.log(`    URL: ${item.url}`);
              
              // Check for medical-related properties
              const medicalProps = ['medicalSpecialty', 'medicalProcedure', 'address', 'telephone', 'priceRange'];
              const foundProps = medicalProps.filter(prop => item[prop] !== undefined);
              if (foundProps.length > 0) {
                console.log(`    Medical Properties: ${foundProps.join(', ')}`);
              }
              
              console.log('');
            });
          } else {
            // Single object
            const type = parsed['@type'] || parsed.type;
            console.log(`  Type: ${JSON.stringify(type)}`);
            console.log(`  ID: ${parsed['@id'] || 'N/A'}`);
            
            if (parsed.name) console.log(`  Name: ${parsed.name}`);
            if (parsed.url) console.log(`  URL: ${parsed.url}`);
          }
          
          console.log('\n📄 Full JSON:');
          console.log(JSON.stringify(parsed, null, 2));
          
        } catch (error) {
          console.error(`❌ Failed to parse JSON: ${error}`);
          console.log(`Preview: ${content.substring(0, 200)}...`);
        }
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSchemaDetails();




