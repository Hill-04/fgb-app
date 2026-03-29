import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
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
    "ALTER TABLE Championship ADD COLUMN promotionUp INTEGER DEFAULT 0;",
    "ALTER TABLE Championship ADD COLUMN hasRelegation INTEGER DEFAULT 0;",
    
    // Category Table
    "ALTER TABLE ChampionshipCategory ADD COLUMN isViable INTEGER DEFAULT 0;"
  ]

  const results = []
  
  for (const sql of commands) {
    try {
      await (prisma as any).$executeRawUnsafe(sql)
      results.push({ sql, status: 'SUCCESS' })
    } catch (error: any) {
      // Ignore if column already exists
      if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
        results.push({ sql, status: 'SKIPPED_EXISTS' })
      } else {
        results.push({ sql, status: 'ERROR', error: error.message })
      }
    }
  }

  return NextResponse.json({ 
    message: 'Database patch process completed', 
    results 
  })
}
