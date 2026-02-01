import { config } from 'dotenv';
import { sql } from './src/lib/db';

// Load environment variables
config({ path: '.env.local' });

async function updateDailyGoalDefault() {
  try {
    console.log('Updating dailyGoal default value...');

    await sql`
      ALTER TABLE dailyGoalSettings 
      ALTER COLUMN dailyGoal SET DEFAULT 100
    `;

    console.log('✓ Updated dailyGoal default to 100');
    console.log('\n✅ Successfully updated database default!');
  } catch (error) {
    console.error('Error updating default:', error);
    throw error;
  }
}

updateDailyGoalDefault()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
