import { config } from 'dotenv';
import { sql } from '@vercel/postgres';

// Load environment variables
config({ path: '.env.local' });

async function addShortCodeColumn() {
  try {
    console.log('Adding short_code column to sessions table...');

    // Add short_code column
    await sql`
      ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS short_code VARCHAR(8) UNIQUE;
    `;

    // Generate short codes for existing sessions
    await sql`
      UPDATE sessions
      SET short_code = SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 8)
      WHERE short_code IS NULL;
    `;

    // Add index for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_short_code
      ON sessions(short_code);
    `;

    console.log('Successfully added short_code column and generated codes');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

addShortCodeColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
