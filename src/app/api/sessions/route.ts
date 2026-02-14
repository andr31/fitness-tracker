import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// Helper to get active session from cookies
export async function getActiveSessionId(): Promise<number | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('activeSessionId')?.value;
  return sessionId ? parseInt(sessionId) : null;
}

// GET /api/sessions - List all sessions (without passwords)
export async function GET() {
  try {
    const result = await sql`
      SELECT s.id, s.name, s.isActive, s.createdAt, s.updatedAt, s.createdAtLocalDate, s.sessionType,
        (SELECT MAX(sub.localDate) FROM (
          SELECT ph.localDate FROM pushupHistory ph WHERE ph.sessionId = s.id GROUP BY ph.localDate HAVING SUM(ph.amount) > 0
        ) sub) as lastActivityDate,
        (SELECT COUNT(*) FROM players p WHERE p.sessionId = s.id) as playerCount
      FROM sessions s
      ORDER BY s.isActive DESC, s.createdAt DESC
    `;

    return NextResponse.json(
      result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        isActive: row.isactive,
        createdAt: row.createdat,
        updatedAt: row.updatedat,
        createdAtLocalDate: row.createdatlocaldate,
        sessionType: row.sessiontype || 'pushups',
        lastActivityDate: row.lastactivitydate
          ? new Date(row.lastactivitydate).toISOString().split('T')[0]
          : null,
        playerCount: parseInt(row.playercount) || 0,
      })),
    );
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 },
    );
  }
}

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    const { name, password, sessionType } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters' },
        { status: 400 },
      );
    }

    // Validate sessionType
    const validSessionType = sessionType === 'plank' ? 'plank' : 'pushups';

    const trimmedName = name.trim();
    const passwordHash = await bcrypt.hash(password, 10);

    // Get current local date in YYYY-MM-DD format
    const now = new Date();
    const localDate =
      now.getFullYear() +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(now.getDate()).padStart(2, '0');

    // Check if session with this name already exists
    const existing = await sql`
      SELECT id FROM sessions WHERE name = ${trimmedName}
    `;

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Session with this name already exists' },
        { status: 409 },
      );
    }

    const result = await sql`
      INSERT INTO sessions (name, passwordHash, isActive, createdAtLocalDate, sessionType) 
      VALUES (${trimmedName}, ${passwordHash}, false, ${localDate}, ${validSessionType})
      RETURNING id, name, isActive, createdAt, updatedAt, createdAtLocalDate, sessionType
    `;

    const newSession = result.rows[0];

    return NextResponse.json(
      {
        id: newSession.id,
        name: newSession.name,
        isActive: newSession.isactive,
        createdAt: newSession.createdat,
        updatedAt: newSession.updatedat,
        createdAtLocalDate: newSession.createdatlocaldate,
        sessionType: newSession.sessiontype,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error('Error creating session:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create session';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
