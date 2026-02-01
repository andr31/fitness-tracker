import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST() {
  try {
    console.log('Adding short_code column to sessions table...');

    // Add short_code column
    await sql`
      ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS short_code VARCHAR(8) UNIQUE;
    `;

    // Generate short codes for existing sessions
    await sql`
      UPDATE sessions
      SET short_code = SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 8)
      WHERE short_code IS NULL;
    `;

    // Add index for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_short_code
      ON sessions(short_code);
    `;

    return NextResponse.json({
      success: true,
      message: 'Successfully added short_code column and generated codes',
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error },
      { status: 500 },
    );
  }
}
