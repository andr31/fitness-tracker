import { config } from 'dotenv';
import { sql } from './src/lib/db';

config({ path: '.env.local' });

async function createPasswordResetsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tokenHash VARCHAR(64) NOT NULL UNIQUE,
      expiresAt TIMESTAMP NOT NULL,
      usedAt TIMESTAMP,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    DELETE FROM password_resets
    WHERE id IN (
      SELECT id
      FROM (
        SELECT
          id,
          ROW_NUMBER() OVER (PARTITION BY userId ORDER BY id DESC) AS rowNumber
        FROM password_resets
      ) duplicates
      WHERE rowNumber > 1
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS password_resets_user_id_unique
    ON password_resets(userId)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_rate_limits (
      keyHash VARCHAR(64) PRIMARY KEY,
      windowStartedAt TIMESTAMP NOT NULL,
      requestCount INTEGER NOT NULL CHECK (requestCount >= 0)
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS password_reset_rate_limits_window_idx
    ON password_reset_rate_limits(windowStartedAt)
  `;

  console.log('✅ Password reset and rate-limit tables are ready');
}

createPasswordResetsTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
