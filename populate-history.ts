import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { sql } from './lib/db';

async function populateHistory() {
  console.log('Starting to reset and populate historical data...');

  const historicalData = [
    // December 9, 2025
    { playerId: 4, amount: 150, date: '2025-12-09 12:00:00' },  // Andrei
    { playerId: 5, amount: 115, date: '2025-12-09 12:00:00' },  // Dumitru
    { playerId: 6, amount: 100, date: '2025-12-09 12:00:00' },  // Ion M.
    { playerId: 8, amount: 150, date: '2025-12-09 12:00:00' },  // Igor
    { playerId: 9, amount: 150, date: '2025-12-09 12:00:00' },  // Sergiu

    // December 10, 2025
    { playerId: 4, amount: 150, date: '2025-12-10 12:00:00' },  // Andrei
    { playerId: 5, amount: 30, date: '2025-12-10 12:00:00' },   // Dumitru
    { playerId: 6, amount: 69, date: '2025-12-10 12:00:00' },   // Ion M.
    { playerId: 8, amount: 150, date: '2025-12-10 12:00:00' },  // Igor
    { playerId: 9, amount: 150, date: '2025-12-10 12:00:00' },  // Sergiu

    // December 11, 2025
    { playerId: 4, amount: 50, date: '2025-12-11 12:00:00' },   // Andrei
    { playerId: 6, amount: 20, date: '2025-12-11 12:00:00' },   // Ion M.
    { playerId: 8, amount: 100, date: '2025-12-11 12:00:00' },  // Igor
    { playerId: 9, amount: 71, date: '2025-12-11 12:00:00' },   // Sergiu
  ];

  try {
    // First, clear all existing history
    console.log('Clearing existing history...');
    await sql`DELETE FROM pushupHistory`;
    console.log('✓ Cleared all existing history');

    // Reset all player totals to 0
    console.log('Resetting player totals...');
    await sql`UPDATE players SET totalpushups = 0, updatedat = CURRENT_TIMESTAMP`;
    console.log('✓ Reset all player totals');

    // Insert fresh data
    console.log('\nInserting fresh historical data...');
    for (const entry of historicalData) {
      await sql`
        INSERT INTO pushupHistory (playerId, amount, timestamp) 
        VALUES (${entry.playerId}, ${entry.amount}, ${entry.date})
      `;
      console.log(`✓ Added ${entry.amount} pushups for player ${entry.playerId} on ${entry.date}`);
    }

    // Update player totals based on the new history
    const players = [4, 5, 6, 7, 8, 9];
    console.log('\nUpdating player totals...');
    
    for (const playerId of players) {
      const result = await sql`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM pushupHistory
        WHERE playerId = ${playerId}
      `;
      
      const total = result.rows[0].total;
      
      await sql`
        UPDATE players 
        SET totalpushups = ${total}, updatedat = CURRENT_TIMESTAMP 
        WHERE id = ${playerId}
      `;
      console.log(`✓ Updated player ${playerId} total to ${total}`);
    }

    console.log('\n✅ Database reset and populated with spreadsheet data successfully!');
  } catch (error) {
    console.error('❌ Error populating data:', error);
  }
}

populateHistory();
