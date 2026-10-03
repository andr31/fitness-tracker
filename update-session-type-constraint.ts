import { config } from 'dotenv';
import { sql } from './src/lib/db';

config({ path: '.env.local' });

async function updateSessionTypeConstraint() {
  try {
    await sql`
      ALTER TABLE sessions
      DROP CONSTRAINT IF EXISTS sessions_sessiontype_check
    `;

    await sql`
      ALTER TABLE sessions
      ADD CONSTRAINT sessions_sessiontype_check
      CHECK (sessionType IN ('pushups', 'plank', 'custom'))
    `;

    const result = await sql`
      SELECT pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conname = 'sessions_sessiontype_check'
        AND conrelid = 'sessions'::regclass
    `;

    console.log('Updated sessions_sessiontype_check:', result.rows[0]?.definition);
  } catch (error) {
    console.error('Error updating sessionType constraint:', error);
    throw error;
  }
}

updateSessionTypeConstraint()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
