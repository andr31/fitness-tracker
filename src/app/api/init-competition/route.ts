import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create competition_settings table
    await sql`
      CREATE TABLE IF NOT EXISTS competition_settings (
        id SERIAL PRIMARY KEY,
        endDate TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Insert default end date if table is empty
    await sql`
      INSERT INTO competition_settings (endDate)
      SELECT '2025-12-24 00:00:00'
      WHERE NOT EXISTS (SELECT 1 FROM competition_settings);
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
