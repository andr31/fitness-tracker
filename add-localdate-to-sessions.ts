import { config } from 'dotenv';
import { sql } from './src/lib/db';

// Load environment variables
config({ path: '.env.local' });

async function addLocalDateToSessions() {
  try {
    console.log('Adding createdAtLocalDate column to sessions table...');
    
    // Add createdAtLocalDate column
    await sql`
      ALTER TABLE sessions 
      ADD COLUMN IF NOT EXISTS createdAtLocalDate VARCHAR(10);
    `;
    
    console.log('Column added successfully');
    
    // Update existing rows to have the local date based on their createdAt
    // This will use the UTC date, but going forward new sessions will use actual local date
    await sql`
      UPDATE sessions 
      SET createdAtLocalDate = TO_CHAR(createdAt, 'YYYY-MM-DD')
      WHERE createdAtLocalDate IS NULL;
    `;
    
    console.log('Existing sessions updated with local dates');
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

addLocalDateToSessions();
