import { config } from 'dotenv';
import { sql } from './src/lib/db';

// Load environment variables
config({ path: '.env.local' });

async function addLocalDateColumn() {
  try {
    console.log('Adding localDate column to pushupHistory table...');
    
    // Add the localDate column
    await sql`
      ALTER TABLE pushupHistory 
      ADD COLUMN IF NOT EXISTS localDate DATE
    `;
    console.log('✓ Column added');
    
    // Backfill existing entries by converting UTC timestamp to PST date
    // PST is UTC-8, so we subtract 8 hours from the timestamp
    await sql`
      UPDATE pushupHistory 
      SET localDate = (timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles')::DATE
      WHERE localDate IS NULL
    `;
    console.log('✓ Backfilled existing entries with PST dates');
    
    // Make the column NOT NULL for future entries
    await sql`
      ALTER TABLE pushupHistory 
      ALTER COLUMN localDate SET NOT NULL
    `;
    console.log('✓ Made localDate NOT NULL');
    
    // Create an index for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_pushuphistory_localdate 
      ON pushupHistory(playerId, localDate)
    `;
    console.log('✓ Created index on localDate');
    
    console.log('\n✅ Successfully added localDate column!');
    console.log('Now update the API to use localDate for queries.');
    
  } catch (error) {
    console.error('Error adding localDate column:', error);
    throw error;
  }
}

addLocalDateColumn()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
