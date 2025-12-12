import { sql } from '@vercel/postgres';

async function createSettingsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('Settings table created successfully');
    
    // Insert default milestone if it doesn't exist
    await sql`
      INSERT INTO settings (key, value)
      VALUES ('milestone', '1000')
      ON CONFLICT (key) DO NOTHING
    `;
    
    console.log('Default milestone setting added');
  } catch (error) {
    console.error('Error creating settings table:', error);
    throw error;
  }
}

createSettingsTable();
