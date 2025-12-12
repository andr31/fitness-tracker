import { config } from 'dotenv';
import { sql } from './src/lib/db';

// Load environment variables
config({ path: '.env.local' });

async function fixIgorHistory() {
  const playerId = 35;
  
  try {
    console.log('Fixing history for Igor (ID 35)...');
    
    // First, delete existing history for Igor
    await sql`DELETE FROM pushupHistory WHERE playerId = ${playerId}`;
    console.log('Cleared existing history');
    
    // December 9, 2025 - 3 entries of 50 each
    await sql`
      INSERT INTO pushupHistory (playerId, amount, timestamp)
      VALUES 
        (${playerId}, 50, '2025-12-09 09:00:00'),
        (${playerId}, 50, '2025-12-09 14:00:00'),
        (${playerId}, 50, '2025-12-09 19:00:00')
    `;
    console.log('Added December 9 entries (150 total)');
    
    // December 10, 2025 - 3 entries of 50 each
    await sql`
      INSERT INTO pushupHistory (playerId, amount, timestamp)
      VALUES 
        (${playerId}, 50, '2025-12-10 09:00:00'),
        (${playerId}, 50, '2025-12-10 14:00:00'),
        (${playerId}, 50, '2025-12-10 19:00:00')
    `;
    console.log('Added December 10 entries (150 total)');
    
    // December 11, 2025 - 3 entries of 50 each
    await sql`
      INSERT INTO pushupHistory (playerId, amount, timestamp)
      VALUES 
        (${playerId}, 50, '2025-12-11 09:00:00'),
        (${playerId}, 50, '2025-12-11 14:00:00'),
        (${playerId}, 50, '2025-12-11 19:00:00')
    `;
    console.log('Added December 11 entries (150 total)');
    
    // December 12, 2025 (today) - 1 entry of 50
    await sql`
      INSERT INTO pushupHistory (playerId, amount, timestamp)
      VALUES 
        (${playerId}, 50, '2025-12-12 10:00:00')
    `;
    console.log('Added December 12 entry (50 total)');
    
    // Update player total to 500 (150 + 150 + 150 + 50)
    await sql`
      UPDATE players 
      SET totalpushups = 500, updatedat = CURRENT_TIMESTAMP 
      WHERE id = ${playerId}
    `;
    console.log('Updated Igor total to 500 pushups');
    
    console.log('\n✅ Successfully fixed Igor\'s history!');
    console.log('- Dec 9: 150 pushups (3 entries)');
    console.log('- Dec 10: 150 pushups (3 entries)');
    console.log('- Dec 11: 150 pushups (3 entries)');
    console.log('- Dec 12: 50 pushups (1 entry)');
    console.log('- Total: 500 pushups');
    
  } catch (error) {
    console.error('Error fixing Igor history:', error);
    throw error;
  }
}

fixIgorHistory()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
