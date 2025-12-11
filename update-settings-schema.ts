import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function updateSchema() {
  try {
    // Create settings table
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ Created settings table');

    // Insert default milestone if it doesn't exist
    await sql`
      INSERT INTO settings (key, value)
      VALUES ('milestone', '500')
      ON CONFLICT (key) DO NOTHING
    `;
    console.log('✓ Added default milestone setting');

    console.log('✅ Database schema updated successfully!');
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    process.exit(1);
  }
}

updateSchema();
