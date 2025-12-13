import { config } from 'dotenv';
import { sql } from './src/lib/db';

// Load environment variables
config({ path: '.env.local' });

async function addDailyGoalTargetColumn() {
  try {
    console.log('Adding dailyGoalTarget column to dailyGoalHistory...');
    
    // Add the column with a default value
    await sql`
      ALTER TABLE dailyGoalHistory 
      ADD COLUMN IF NOT EXISTS dailyGoalTarget INTEGER
    `;
    console.log('✓ Added dailyGoalTarget column');
    
    // Update existing rows with the current daily goal for each player
    await sql`
      UPDATE dailyGoalHistory dh
      SET dailyGoalTarget = dgs.dailyGoal
      FROM dailyGoalSettings dgs
      WHERE dh.playerId = dgs.playerId AND dh.dailyGoalTarget IS NULL
    `;
    console.log('✓ Updated existing rows with current daily goal');
    
    // Make the column NOT NULL now that we've filled it
    await sql`
      ALTER TABLE dailyGoalHistory 
      ALTER COLUMN dailyGoalTarget SET NOT NULL
    `;
    console.log('✓ Set dailyGoalTarget as NOT NULL');
    
    console.log('\n✅ Successfully added dailyGoalTarget column!');
    
  } catch (error) {
    console.error('Error adding dailyGoalTarget column:', error);
    throw error;
  }
}

addDailyGoalTargetColumn()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
