import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Helper to get active session from cookies
async function getActiveSessionId(): Promise<number | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('activeSessionId')?.value;
  return sessionId ? parseInt(sessionId) : null;
}

// Helper to transform lowercase column names to camelCase
function transformRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    totalPushups: row.totalpushups,
    createdAt: row.createdat,
    updatedAt: row.updatedat,
  };
}

export async function GET() {
  try {
    const sessionId = await getActiveSessionId();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No active session. Please select a session first.' },
        { status: 401 }
      );
    }

    const result = await sql`
      SELECT id, name, totalpushups, createdat, updatedat 
      FROM players 
      WHERE sessionId = ${sessionId}
      ORDER BY totalpushups DESC, updatedat ASC
    `;

    return NextResponse.json(result.rows.map(transformRow));
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = await getActiveSessionId();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No active session. Please select a session first.' },
        { status: 401 }
      );
    }

    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();

    const result = await sql`
      INSERT INTO players (name, totalpushups, sessionId) 
      VALUES (${trimmedName}, 0, ${sessionId})
      RETURNING id, name, totalpushups, createdat, updatedat
    `;

    return NextResponse.json(transformRow(result.rows[0]), { status: 201 });
  } catch (error: any) {
    console.error('Error creating player:', error);
    if (error.message?.includes('duplicate key') || error.code === '23505') {
      return NextResponse.json(
        { error: 'Player name already exists in this session' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}
