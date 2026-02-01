import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function makeSessionIdNullable() {
  try {
    // Make sessionId nullable in settings table for global settings
    await sql`
      ALTER TABLE settings 
      ALTER COLUMN sessionId DROP NOT NULL
    `;

    console.log('✓ Made sessionId nullable in settings table');
    console.log('  This allows storing global settings like admin password');
  } catch (error) {
    console.error('Error modifying settings table:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

makeSessionIdNullable();
