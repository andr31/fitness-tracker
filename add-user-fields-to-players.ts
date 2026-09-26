import { config } from 'dotenv';
import { sql } from './src/lib/db';

// Load environment variables
config({ path: '.env.local' });

async function addUserFieldsToPlayers() {
  try {
    console.log('Adding user account fields to players table...');

    await sql`
      ALTER TABLE players
      ADD COLUMN IF NOT EXISTS userId INTEGER REFERENCES users(id) ON DELETE SET NULL
    `;
    console.log('✓ Added userId column');

    await sql`
      ALTER TABLE players
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'member'
    `;
    console.log('✓ Added role column (default: member)');

    // A user can only have one player per session (one-player-per-user rule).
    // Partial index so it only applies to account-linked rows; NULLs are unrestricted.
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_players_session_user_unique
      ON players(sessionId, userId)
      WHERE userId IS NOT NULL
    `;
    console.log('✓ Added unique index on (sessionId, userId)');

    console.log('\n✅ Successfully updated players table!');
  } catch (error) {
    console.error('Error updating players table:', error);
    throw error;
  }
}

addUserFieldsToPlayers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
