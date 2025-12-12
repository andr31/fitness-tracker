import { config } from 'dotenv';
import { sql } from './src/lib/db';

// Load environment variables
config({ path: '.env.local' });

async function createDailyGoalTables() {
  try {
    console.log('Creating daily goal tables...');
    
    // Create dailyGoalSettings table
    await sql`
      CREATE TABLE IF NOT EXISTS dailyGoalSettings (
        playerId INTEGER PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
        dailyGoal INTEGER NOT NULL DEFAULT 100,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ Created dailyGoalSettings table');
    
    // Create dailyGoalHistory table
    await sql`
      CREATE TABLE IF NOT EXISTS dailyGoalHistory (
        id SERIAL PRIMARY KEY,
        playerId INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        localDate DATE NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ Created dailyGoalHistory table');
    
    // Create indexes for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_dailygoalhistory_player_date 
      ON dailyGoalHistory(playerId, localDate)
    `;
    console.log('✓ Created indexes');
    
    // Insert default daily goals for existing players
    await sql`
      INSERT INTO dailyGoalSettings (playerId, dailyGoal)
      SELECT id, 100 FROM players
      ON CONFLICT (playerId) DO NOTHING
    `;
    console.log('✓ Set default daily goals for existing players');
    
    console.log('\n✅ Successfully created daily goal tables!');
    
  } catch (error) {
    console.error('Error creating daily goal tables:', error);
    throw error;
  }
}

createDailyGoalTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
