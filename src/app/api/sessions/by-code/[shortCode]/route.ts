import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> },
) {
  try {
    const { shortCode } = await params;
    console.log('Looking up session with short code:', shortCode);

    const result = await sql`
      SELECT id, name, sessiontype 
      FROM sessions 
      WHERE short_code = ${shortCode}
    `;

    console.log('Query returned:', result.rows.length, 'rows');

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = result.rows[0];
    console.log('Found session:', session);

    return NextResponse.json({
      id: session.id,
      name: session.name,
      sessionType: session.sessiontype,
    });
  } catch (error) {
    console.error('Error fetching session by code:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      {
        error: 'Failed to fetch session',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
