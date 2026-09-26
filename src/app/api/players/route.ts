import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';

// Helper to get active session from cookies
async function getActiveSessionId(): Promise<number | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('activeSessionId')?.value;
  return sessionId ? parseInt(sessionId) : null;
}

// Helper to transform lowercase column names to camelCase
function transformRow(row: any, currentUserId?: number) {
  return {
    id: row.id,
    name: row.name,
    totalPushups: parseFloat(row.totalpushups) || 0,
    createdAt: row.createdat,
    updatedAt: row.updatedat,
    role: row.role || 'member',
    isMine: currentUserId != null && row.userid === currentUserId,
  };
}

export async function GET() {
  try {
    const sessionId = await getActiveSessionId();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No active session. Please select a session first.' },
        { status: 401 },
      );
    }

    const result = await sql`
      SELECT id, name, totalpushups, createdat, updatedat, userId, role 
      FROM players 
      WHERE sessionId = ${sessionId}
      ORDER BY totalpushups DESC, updatedat ASC
    `;

    const currentUser = await getCurrentUser();

    return NextResponse.json(
      result.rows.map((row) => transformRow(row, currentUser?.id)),
    );
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = await getActiveSessionId();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No active session. Please select a session first.' },
        { status: 401 },
      );
    }

    const sessionResult = await sql`
      SELECT authMode, creatorUserId FROM sessions WHERE id = ${sessionId}
    `;
    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const { authmode: authMode, creatoruserid: creatorUserId } =
      sessionResult.rows[0];

    let trimmedName: string;
    let userId: number | null = null;
    let role = 'member';

    if (authMode === 'account') {
      // Account-based sessions: joining requires login, one player per user.
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return NextResponse.json(
          { error: 'Please log in to join this session' },
          { status: 401 },
        );
      }

      const existingPlayer = await sql`
        SELECT id FROM players WHERE sessionId = ${sessionId} AND userId = ${currentUser.id}
      `;
      if (existingPlayer.rows.length > 0) {
        return NextResponse.json(
          { error: 'You have already joined this session' },
          { status: 409 },
        );
      }

      trimmedName = currentUser.displayName.trim();
      userId = currentUser.id;
      role = currentUser.id === creatorUserId ? 'admin' : 'member';
    } else {
      const { name } = await request.json();
      if (!name || typeof name !== 'string') {
        return NextResponse.json(
          { error: 'Name is required' },
          { status: 400 },
        );
      }
      trimmedName = name.trim();
    }

    const result = await sql`
      INSERT INTO players (name, totalpushups, sessionId, userId, role) 
      VALUES (${trimmedName}, 0, ${sessionId}, ${userId}, ${role})
      RETURNING id, name, totalpushups, createdat, updatedat, userId, role
    `;

    return NextResponse.json(
      transformRow(result.rows[0], userId ?? undefined),
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Error creating player:', error);
    if (error.message?.includes('duplicate key') || error.code === '23505') {
      return NextResponse.json(
        { error: 'Player name already exists in this session' },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 },
    );
  }
}
