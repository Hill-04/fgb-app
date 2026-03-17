import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  if (!url) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  try {
    console.log('Inspecting table Championship...');
    const result = await client.execute('PRAGMA table_info(Championship);');
    console.log('Columns:');
    result.rows.forEach(row => {
      console.log(`- ${row.name} (${row.type})`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.close();
  }
}

main();
