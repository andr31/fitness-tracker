import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Drop old table if it exists and recreate with TEXT column
    await sql`DROP TABLE IF EXISTS competition_settings;`;
    
    // Create competition_settings table with TEXT endDate (no timezone)
    await sql`
      CREATE TABLE competition_settings (
        id SERIAL PRIMARY KEY,
        endDate TEXT NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Insert default end date as local datetime string (without timezone)
    await sql`
      INSERT INTO competition_settings (endDate)
      VALUES ('2025-12-25T00:00:00');
    `;

    return NextResponse.json({ success: true, message: 'Competition settings initialized' });
  } catch (error) {
    console.error('Error initializing competition settings:', error);
    return NextResponse.json(
      { error: 'Failed to initialize competition settings', details: error },
      { status: 500 }
    );
  }
}
