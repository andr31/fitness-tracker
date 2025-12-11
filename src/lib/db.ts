import { sql } from '@vercel/postgres';

export async function initializeDatabase() {
  try {
    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        totalPushups INTEGER DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS pushupHistory (
        id SERIAL PRIMARY KEY,
        playerId INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_player_pushups ON pushupHistory(playerId);
    `;

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

export { sql };
