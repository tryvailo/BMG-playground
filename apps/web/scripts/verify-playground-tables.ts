#!/usr/bin/env tsx
/**
 * Script to verify that playground audit tables are created
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTables() {
  console.log('🔍 Checking playground audit tables...\n');

  const tables = ['playground_tech_audits', 'content_audits', 'eeat_audits'];

  for (const tableName of tables) {
    try {
      // Try to query the table (this will fail if table doesn't exist)
      const { data: _data, error } = await (supabase as unknown as { from: (name: string) => { select: (cols: string) => { limit: (n: number) => Promise<{ data: unknown; error: { code?: string; message: string } | null }> } } })
        .from(tableName)
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist
          console.log(`❌ ${tableName}: Table not found`);
        } else {
          console.log(`⚠️  ${tableName}: Error - ${error.message}`);
        }
      } else {
        console.log(`✅ ${tableName}: Table exists and is accessible`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: Error - ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log('\n✅ Verification complete!');
}

verifyTables().catch(console.error);








