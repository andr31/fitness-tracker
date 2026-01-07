import { config } from 'dotenv';
import { sql } from './src/lib/db';

// Load environment variables
config({ path: '.env.local' });

async function addSessionIdToTables() {
  try {
    console.log('Adding sessionId to existing tables...');
    
    // Add sessionId to players table
    await sql`
      ALTER TABLE players 
      ADD COLUMN IF NOT EXISTS sessionId INTEGER REFERENCES sessions(id) ON DELETE CASCADE
    `;
    console.log('✓ Added sessionId to players table');
    
    // Add sessionId to pushupHistory table
    await sql`
      ALTER TABLE pushupHistory 
      ADD COLUMN IF NOT EXISTS sessionId INTEGER REFERENCES sessions(id) ON DELETE CASCADE
    `;
    console.log('✓ Added sessionId to pushupHistory table');
    
    // Add sessionId to dailyGoalSettings table
    await sql`
      ALTER TABLE dailyGoalSettings 
      ADD COLUMN IF NOT EXISTS sessionId INTEGER REFERENCES sessions(id) ON DELETE CASCADE
    `;
    console.log('✓ Added sessionId to dailyGoalSettings table');
    
    // Add sessionId to dailyGoalHistory table
    await sql`
      ALTER TABLE dailyGoalHistory 
      ADD COLUMN IF NOT EXISTS sessionId INTEGER REFERENCES sessions(id) ON DELETE CASCADE
    `;
    console.log('✓ Added sessionId to dailyGoalHistory table');
    
    // Add sessionId to competition_settings table
    await sql`
      ALTER TABLE competition_settings 
      ADD COLUMN IF NOT EXISTS sessionId INTEGER REFERENCES sessions(id) ON DELETE CASCADE
    `;
    console.log('✓ Added sessionId to competition_settings table');
    
    // Add sessionId to settings table
    await sql`
      ALTER TABLE settings 
      ADD COLUMN IF NOT EXISTS sessionId INTEGER REFERENCES sessions(id) ON DELETE CASCADE
    `;
    console.log('✓ Added sessionId to settings table');
    
    // Create indexes for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_players_session ON players(sessionId)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_pushuphistory_session ON pushupHistory(sessionId)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_dailygoalsettings_session ON dailyGoalSettings(sessionId)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_dailygoalhistory_session ON dailyGoalHistory(sessionId)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_competition_settings_session ON competition_settings(sessionId)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_settings_session ON settings(sessionId)
    `;
    console.log('✓ Created session indexes');
    
    console.log('\n✅ Successfully added sessionId to all tables!');
    
  } catch (error) {
    console.error('Error adding sessionId to tables:', error);
    throw error;
  }
}

addSessionIdToTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
