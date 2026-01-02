import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

interface CityRow {
  city?: string;
  місто?: string;
  City?: string;
  Місто?: string;
  'Місто / Регіон'?: string;
  'місто / регіон'?: string;
  'Місто/Регіон'?: string;
  'місто/регіон'?: string;
  [key: string]: unknown;
}

async function importUkraineCities() {
  console.log('📖 Reading Excel file...\n');

  // Path relative to the project root (nextjs-saas-starter)
  // Script runs from apps/web directory, so we go up two levels to reach root
  const excelPath = path.resolve(process.cwd(), '../../temp/medical_centers_ukraine_200plus.xlsx');
  
  if (!fs.existsSync(excelPath)) {
    console.error('❌ Excel file not found at:', excelPath);
    process.exit(1);
  }

  // Read Excel file
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // First, get the header row to see what columns are available
  const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })[0] as string[];
  console.log('📋 Available columns:', headerRow);
  
  // Find the column that contains "Місто" or "місто" (case-insensitive)
  const cityColumnName = headerRow.find(col => 
    col && typeof col === 'string' && 
    col.toLowerCase().includes('місто')
  );
  
  console.log(`📍 Found city column: "${cityColumnName}"`);
  console.log('');

  // Read data with header row
  const data = XLSX.utils.sheet_to_json<CityRow>(worksheet, { 
    defval: '',
    raw: false // Get formatted values as strings
  });

  console.log(`✅ Found ${data.length} rows in sheet "${sheetName}"`);
  if (data.length > 0) {
    console.log('📋 First row sample:', Object.keys(data[0]));
    console.log('📋 First row city value:', (data[0] as Record<string, unknown>)[cityColumnName || '']);
  }
  console.log('');

  // Extract unique cities
  const citiesSet = new Set<string>();
  
  for (const row of data) {
    // Try to get city from the identified column, or try common column names
    let cityName: string | undefined;
    
    if (cityColumnName) {
      cityName = (row as Record<string, unknown>)[cityColumnName] as string | undefined;
    }
    
    // Fallback to common column name variations
    if (!cityName) {
      cityName = row['Місто / Регіон'] || 
                 row['місто / регіон'] || 
                 row['Місто/Регіон'] || 
                 row['місто/регіон'] ||
                 row.city || 
                 row.місто || 
                 row.City || 
                 row.Місто;
    }
    
    if (cityName && typeof cityName === 'string') {
      // Handle case where cell might contain "City / Region" - extract just the city part
      // Split by "/" and take the first part (city), also handle other separators
      const parts = cityName.split(/[/|,]/).map(p => p.trim());
      const city = parts[0] || cityName.trim();
      
      if (city && city.length > 0) {
        citiesSet.add(city);
      }
    }
  }

  const cities = Array.from(citiesSet).sort();
  
  console.log(`✅ Found ${cities.length} unique cities`);
  console.log('📋 Sample cities:', cities.slice(0, 10).join(', '));
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

  console.log(`\n✅ Successfully imported ${inserted} cities!`);
}

importUkraineCities().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

