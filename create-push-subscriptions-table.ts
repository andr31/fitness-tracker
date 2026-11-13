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
  await sql`
    ALTER TABLE push_subscriptions
    ADD COLUMN IF NOT EXISTS reminder_times JSONB NOT NULL DEFAULT '["19:00"]'::jsonb
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS push_reminder_attempts (
      subscription_id INTEGER NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reminder_date DATE NOT NULL,
      reminder_time TEXT NOT NULL,
      attempt_id TEXT NOT NULL,
      PRIMARY KEY (subscription_id, user_id, reminder_date, reminder_time)
    )
  `;
  await sql`
    INSERT INTO push_reminder_attempts (subscription_id, user_id, reminder_date, reminder_time, attempt_id)
    SELECT id, user_id, last_reminder_date, '19:00', COALESCE(last_attempt_id, 'legacy')
    FROM push_subscriptions WHERE last_reminder_date IS NOT NULL
    ON CONFLICT DO NOTHING
  `;
  await sql`
    UPDATE push_subscriptions SET last_reminder_date = NULL, last_attempt_id = NULL
    WHERE last_reminder_date IS NOT NULL
  `;
  console.log('Push subscriptions table is ready.');
}

createPushSubscriptionsTable().catch((error) => {
  console.error('Failed to create push subscriptions table:', error);
  process.exitCode = 1;
});
