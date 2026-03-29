import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function verify() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  try {
    const res = await client.execute("SELECT court FROM Game LIMIT 1;");
    console.log('✅ Query SUCCESS. Results:', res.rows);
  } catch (e: any) {
    console.error('❌ Query FAILED:', e.message);
  }
  process.exit(0);
}

verify();
