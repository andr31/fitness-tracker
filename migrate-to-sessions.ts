import { config } from 'dotenv';
import { sql } from './src/lib/db';
import * as bcrypt from 'bcryptjs';

// Load environment variables
config({ path: '.env.local' });

async function migrateToSessions() {
  try {
    console.log('Migrating existing data to sessions...');
    
    // Check if default session already exists
    const existingSessions = await sql`SELECT * FROM sessions WHERE name = 'Default Session'`;
    
    let defaultSessionId: number;
    
    if (existingSessions.rows.length > 0) {
      defaultSessionId = existingSessions.rows[0].id;
      console.log('✓ Default session already exists (ID:', defaultSessionId, ')');
    } else {
      // Create default session with a default password
      const defaultPassword = 'fitness2025'; // Users should change this
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      
      const result = await sql`
        INSERT INTO sessions (name, passwordHash, isActive)
        VALUES ('Default Session', ${passwordHash}, true)
        RETURNING id
      `;
      defaultSessionId = result.rows[0].id;
      console.log('✓ Created default session (ID:', defaultSessionId, ')');
      console.log('  📌 Default password:', defaultPassword, '(please change this!)');
    }
    
    // Update all existing records to use the default session
    await sql`
      UPDATE players 
      SET sessionId = ${defaultSessionId} 
      WHERE sessionId IS NULL
    `;
    console.log('✓ Updated players with default sessionId');
    
    await sql`
      UPDATE pushupHistory 
      SET sessionId = ${defaultSessionId} 
      WHERE sessionId IS NULL
    `;
    console.log('✓ Updated pushupHistory with default sessionId');
    
    await sql`
      UPDATE dailyGoalSettings 
      SET sessionId = ${defaultSessionId} 
      WHERE sessionId IS NULL
    `;
    console.log('✓ Updated dailyGoalSettings with default sessionId');
    
    await sql`
      UPDATE dailyGoalHistory 
      SET sessionId = ${defaultSessionId} 
      WHERE sessionId IS NULL
    `;
    console.log('✓ Updated dailyGoalHistory with default sessionId');
    
    await sql`
      UPDATE competition_settings 
      SET sessionId = ${defaultSessionId} 
      WHERE sessionId IS NULL
    `;
    console.log('✓ Updated competition_settings with default sessionId');
    
    await sql`
      UPDATE settings 
      SET sessionId = ${defaultSessionId} 
      WHERE sessionId IS NULL
    `;
    console.log('✓ Updated settings with default sessionId');
    
    // Make sessionId NOT NULL after migration
    console.log('\nMaking sessionId required on all tables...');
    
    await sql`ALTER TABLE players ALTER COLUMN sessionId SET NOT NULL`;
    await sql`ALTER TABLE pushupHistory ALTER COLUMN sessionId SET NOT NULL`;
    await sql`ALTER TABLE dailyGoalSettings ALTER COLUMN sessionId SET NOT NULL`;
    await sql`ALTER TABLE dailyGoalHistory ALTER COLUMN sessionId SET NOT NULL`;
    await sql`ALTER TABLE competition_settings ALTER COLUMN sessionId SET NOT NULL`;
    await sql`ALTER TABLE settings ALTER COLUMN sessionId SET NOT NULL`;
    
    console.log('✓ Made sessionId required');
    
    // Update unique constraints to include sessionId
    console.log('\nUpdating unique constraints...');
    
    // Drop old unique constraint on players.name and add new one with sessionId
    await sql`
      ALTER TABLE players DROP CONSTRAINT IF EXISTS players_name_key
    `;
    await sql`
      ALTER TABLE players ADD CONSTRAINT players_name_session_unique UNIQUE (name, sessionId)
    `;
    console.log('✓ Updated players unique constraint (name + sessionId)');
    
    // Drop old unique constraint on settings.key and add new one with sessionId
    await sql`
      ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_key_key
    `;
    await sql`
      ALTER TABLE settings ADD CONSTRAINT settings_key_session_unique UNIQUE (key, sessionId)
    `;
    console.log('✓ Updated settings unique constraint (key + sessionId)');
    
    // Update dailyGoalSettings primary key to include sessionId
    await sql`
      ALTER TABLE dailyGoalSettings DROP CONSTRAINT IF EXISTS dailygoalsettings_pkey
    `;
    await sql`
      ALTER TABLE dailyGoalSettings ADD CONSTRAINT dailygoalsettings_pkey PRIMARY KEY (playerId, sessionId)
    `;
    console.log('✓ Updated dailyGoalSettings primary key (playerId + sessionId)');
    
    console.log('\n✅ Successfully migrated to sessions!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run the session management code');
    console.log('   2. Change the default password for security');
    console.log('   3. Create new sessions for different competitions');
    
  } catch (error) {
    console.error('Error migrating to sessions:', error);
    throw error;
  }
}

migrateToSessions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
