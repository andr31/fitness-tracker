import { config } from 'dotenv';
import { sql } from './src/lib/db';

// Load environment variables
config({ path: '.env.local' });

async function addAccountFieldsToSessions() {
  try {
    console.log('Adding account fields to sessions table...');

    await sql`
      ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS authMode VARCHAR(20) NOT NULL DEFAULT 'open'
    `;
    console.log('✓ Added authMode column (default: open)');

    await sql`
      ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS creatorUserId INTEGER REFERENCES users(id) ON DELETE SET NULL
    `;
    console.log('✓ Added creatorUserId column');

    console.log('\n✅ Successfully updated sessions table!');
  } catch (error) {
    console.error('Error updating sessions table:', error);
    throw error;
  }
}

addAccountFieldsToSessions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
