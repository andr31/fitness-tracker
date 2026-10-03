import { config } from 'dotenv';
import { sql } from './src/lib/db';

// Load environment variables
config({ path: '.env.local' });

async function addCustomExerciseNameColumn() {
  try {
    console.log('Adding customExerciseName column to sessions table...');

    await sql`
      ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS customExerciseName VARCHAR(50)
    `;
    console.log('✓ Added customExerciseName column');

    console.log('\n✅ Successfully updated sessions table!');
  } catch (error) {
    console.error('Error updating sessions table:', error);
    throw error;
  }
}

addCustomExerciseNameColumn()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
