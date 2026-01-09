import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parse TSV file and extract cities
 */
function parseTSV(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('TSV file is empty');
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = headerLine.split('\t').map(h => h.trim());
  
  console.log('📋 TSV Headers:', headers);
  
  // Find the city column index
  const cityColumnIndex = headers.findIndex(h => 
    h && typeof h === 'string' && h.toLowerCase().includes('місто')
  );
  
  if (cityColumnIndex === -1) {
    throw new Error('Could not find city column in TSV file');
  }
  
  console.log(`📍 Found city column at index ${cityColumnIndex}: "${headers[cityColumnIndex]}"`);
  console.log('');

  // Extract unique cities from data rows (skip header)
  const citiesSet = new Set<string>();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split('\t');
    const cityName = columns[cityColumnIndex]?.trim();
    
    if (cityName && cityName.length > 0 && cityName !== headers[cityColumnIndex]) {
      // TSV format already contains only city names (no "City / Region" format)
      // But we'll still handle it just in case
      const parts = cityName.split(/[/|,]/).map(p => p.trim());
      const city = parts[0] || cityName;
      
      if (city && city.length > 0) {
        citiesSet.add(city);
      }
    }
  }

  return Array.from(citiesSet).sort();
}

async function importUkraineCitiesFromTSV() {
  console.log('📖 Reading TSV file...\n');

  // Path relative to the project root (nextjs-saas-starter)
  // Script runs from apps/web directory, so we go up two levels to reach root
  const tsvPath = path.resolve(process.cwd(), '../../temp/medical_centers_ukraine.tsv');
  
  if (!fs.existsSync(tsvPath)) {
    console.error('❌ TSV file not found at:', tsvPath);
    process.exit(1);
  }

  // Parse TSV and extract cities
  const cities = parseTSV(tsvPath);
  
  console.log(`✅ Found ${cities.length} unique cities`);
  console.log('📋 Sample cities:', cities.slice(0, 15).join(', '));
  console.log('');

  // Insert cities into database
  console.log('💾 Inserting cities into database...\n');

  // First, clear existing cities for Ukraine
  const { error: deleteError } = await supabase
    .from('ukraine_cities')
    .delete()
    .eq('country_code', 'UA');

  if (deleteError) {
    console.warn('⚠️  Could not clear existing cities (table might not exist yet):', deleteError.message);
  } else {
    console.log('✅ Cleared existing cities');
  }

  // Insert cities
  const citiesToInsert = cities.map((city) => ({
    name: city,
    country_code: 'UA',
    created_at: new Date().toISOString(),
  }));

  // Insert in batches of 100
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < citiesToInsert.length; i += batchSize) {
    const batch = citiesToInsert.slice(i, i + batchSize);
    const { error: insertError } = await supabase
      .from('ukraine_cities')
      .insert(batch);

    if (insertError) {
      console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, insertError.message);
      console.error('Batch:', batch.slice(0, 3));
    } else {
      inserted += batch.length;
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${inserted}/${citiesToInsert.length} cities`);
    }
  }

  console.log(`\n✅ Successfully imported ${inserted} cities from TSV!`);
}

importUkraineCitiesFromTSV().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});






