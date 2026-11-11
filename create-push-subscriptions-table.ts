import { config } from 'dotenv';
import { sql } from './src/lib/db';

config({ path: '.env.local' });

async function createPushSubscriptionsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      device_hash TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      timezone TEXT NOT NULL,
      last_reminder_date DATE,
      last_attempt_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log('Push subscriptions table is ready.');
}

createPushSubscriptionsTable().catch((error) => {
  console.error('Failed to create push subscriptions table:', error);
  process.exitCode = 1;
});
