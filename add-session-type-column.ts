import { sql } from './src/lib/db';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local file manually
try {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex);
        let value = trimmedLine.substring(equalIndex + 1);
        // Remove quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.log(
    'Could not load .env.local, proceeding with existing environment variables',
  );
}

async function addSessionTypeColumn() {
  try {
    console.log('Adding sessionType column to sessions table...');

    // Add sessionType column with default value 'pushups'
    await sql`
      ALTER TABLE sessions 
      ADD COLUMN IF NOT EXISTS sessionType VARCHAR(50) DEFAULT 'pushups'
    `;
    console.log('✓ Added sessionType column');

    // Update existing sessions to have 'pushups' type
    await sql`
      UPDATE sessions 
      SET sessionType = 'pushups' 
      WHERE sessionType IS NULL
    `;
    console.log('✓ Updated existing sessions to pushups type');

    // Add check constraint to ensure only valid session types
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'sessions_sessiontype_check'
        ) THEN
          ALTER TABLE sessions 
          ADD CONSTRAINT sessions_sessiontype_check 
          CHECK (sessionType IN ('pushups', 'plank'));
        END IF;
      END $$;
    `;
    console.log('✓ Added constraint for valid session types');

    console.log('\n✅ Successfully added sessionType column!');
  } catch (error) {
    console.error('Error adding sessionType column:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

addSessionTypeColumn();
