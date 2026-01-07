import { config } from 'dotenv';
import { sql } from './src/lib/db';

// Load environment variables
config({ path: '.env.local' });

async function updateSessionDates() {
  try {
    console.log('Updating session dates to current local date...');
    
    // Get current local date
    const now = new Date();
    const localDate = now.getFullYear() + '-' + 
                      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(now.getDate()).padStart(2, '0');
    
    console.log(`Setting all sessions to local date: ${localDate}`);
    
    // Update all sessions to current local date
    const result = await sql`
      UPDATE sessions 
      SET createdAtLocalDate = ${localDate}
    `;
    
    console.log(`Updated ${result.rowCount} session(s)`);
    console.log('Update completed successfully!');
  } catch (error) {
    console.error('Error during update:', error);
    throw error;
  }
}

updateSessionDates();
