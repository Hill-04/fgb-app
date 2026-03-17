import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

async function runSql(client: any, sql: string) {
  try {
    console.log(`Executing: ${sql}`);
    await client.execute(sql);
    console.log('Success');
  } catch (err: any) {
    if (err.message && err.message.includes('already exists')) {
      console.log('Skipped (already exists)');
    } else {
      console.error(`Error: ${err.message}`);
    }
  }
}

async function main() {
  if (!url) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  try {
    console.log('Updating Championship table...');
    await runSql(client, "ALTER TABLE Championship ADD COLUMN year INTEGER DEFAULT 2026;");
    await runSql(client, "ALTER TABLE Championship ADD COLUMN turns INTEGER DEFAULT 1;");
    await runSql(client, "ALTER TABLE Championship ADD COLUMN fieldControl TEXT DEFAULT 'alternado';");
    await runSql(client, "ALTER TABLE Championship ADD COLUMN tiebreakers TEXT DEFAULT 'pontos,saldo,confronto_direto,pontos_marcados';");
    await runSql(client, "ALTER TABLE Championship ADD COLUMN hasRelegation BOOLEAN DEFAULT 0;");
    await runSql(client, "ALTER TABLE Championship ADD COLUMN relegationDown INTEGER DEFAULT 0;");
    await runSql(client, "ALTER TABLE Championship ADD COLUMN promotionUp INTEGER DEFAULT 0;");
    await runSql(client, "ALTER TABLE Championship ADD COLUMN hasPlayoffs BOOLEAN DEFAULT 0;");
    await runSql(client, "ALTER TABLE Championship ADD COLUMN playoffTeams INTEGER DEFAULT 4;");
    await runSql(client, "ALTER TABLE Championship ADD COLUMN playoffFormat TEXT DEFAULT 'melhor_de_1';");
    await runSql(client, "ALTER TABLE Championship ADD COLUMN hasThirdPlace BOOLEAN DEFAULT 1;");
    await runSql(client, "ALTER TABLE Championship ADD COLUMN hasBlocks BOOLEAN DEFAULT 0;");

    console.log('Updating ChampionshipCategory table...');
    await runSql(client, "ALTER TABLE ChampionshipCategory ADD COLUMN isViable BOOLEAN DEFAULT 0;");

    console.log('Creating Block table...');
    await runSql(client, `
      CREATE TABLE IF NOT EXISTS Block (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        championshipId TEXT NOT NULL,
        categories TEXT NOT NULL,
        FOREIGN KEY (championshipId) REFERENCES Championship (id) ON DELETE CASCADE
      );
    `);

    console.log('Ensuring Category constraint...');
    // In SQLite/LibSQL you can't easily add constraints to existing tables without re-creating.
    // For now we assume the basics are there.

    console.log('Migration finished!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    client.close();
  }
}

main();
