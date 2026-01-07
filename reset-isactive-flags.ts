import { config } from 'dotenv';
import { sql } from './src/lib/db';

// Load environment variables
config({ path: '.env.local' });

async function resetIsActiveFlags() {
  try {
    console.log('Resetting all isActive flags to false...');
    
    // Set all sessions to inactive (we use cookies now, not database flags)
    const result = await sql`
      UPDATE sessions 
      SET isActive = false
    `;
    
    console.log(`Updated ${result.rowCount} session(s)`);
    console.log('All isActive flags reset successfully!');
    console.log('Note: Active sessions are now tracked by cookies only.');
  } catch (error) {
    console.error('Error during reset:', error);
    throw error;
  }
}

resetIsActiveFlags();
