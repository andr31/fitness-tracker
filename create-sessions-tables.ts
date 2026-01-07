import { config } from 'dotenv';
import { sql } from './src/lib/db';

// Load environment variables
config({ path: '.env.local' });

async function createSessionsTables() {
  try {
    console.log('Creating sessions tables...');
    
    // Create sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        passwordHash VARCHAR(255) NOT NULL,
        isActive BOOLEAN DEFAULT false,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ Created sessions table');
    
    // Create session_history table to store snapshots of data
    await sql`
      CREATE TABLE IF NOT EXISTS session_history (
        id SERIAL PRIMARY KEY,
        sessionId INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        snapshotType VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ Created session_history table');
    
    // Create index on sessionId for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_session_history_session 
      ON session_history(sessionId, createdAt)
    `;
    console.log('✓ Created indexes');
    
    console.log('\n✅ Successfully created sessions tables!');
    
  } catch (error) {
    console.error('Error creating sessions tables:', error);
    throw error;
  }
}

createSessionsTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
