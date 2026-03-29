import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';

// Force load .env
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function runPatch() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  if (!url) {
    console.error('❌ DATABASE_URL missing');
    return;
  }

  console.log(`📡 Connecting to ${url}...`);

  const client = createClient({
    url,
    authToken,
  });

  // Verificação de estrutura
  console.log('🔍 Checking Game table structure...');
  const tableInfo = await client.execute("PRAGMA table_info(Game);");
  const columns = tableInfo.rows.map(r => String(r.name));
  console.log('📦 Columns found in Game:', columns.join(', '));

  const commands = [
    // Game Table
    "ALTER TABLE Game ADD COLUMN court TEXT;",
    "ALTER TABLE Game ADD COLUMN round INTEGER DEFAULT 1;",
    "ALTER TABLE Game ADD COLUMN blockId TEXT;",
    
    // Registration Table
    "ALTER TABLE Registration ADD COLUMN canHost INTEGER DEFAULT 0;",
    "ALTER TABLE Registration ADD COLUMN gymName TEXT;",
    "ALTER TABLE Registration ADD COLUMN gymAddress TEXT;",
    "ALTER TABLE Registration ADD COLUMN gymCity TEXT;",
    "ALTER TABLE Registration ADD COLUMN gymMapsLink TEXT;",
    
    // Championship Table
    "ALTER TABLE Championship ADD COLUMN minTeamsPerCat INTEGER DEFAULT 3;",
    "ALTER TABLE Championship ADD COLUMN isSimulation INTEGER DEFAULT 0;",
    "ALTER TABLE Championship ADD COLUMN relegationDown INTEGER DEFAULT 0;",
    "ALTER TABLE Championship ADD COLUMN promotionUp INTEGER DEFAULT 0;"
  ];

  for (const sql of commands) {
    try {
      console.log(`⚡ Executing: ${sql}`);
      await client.execute(sql);
      console.log('✅ SUCCESS');
    } catch (error: any) {
      if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
        console.log('⏭️ SKIPPED (Already exists)');
      } else {
        console.error(`❌ ERROR: ${error.message}`);
      }
    }
  }

  process.exit(0);
}

runPatch().catch(console.error);
