import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getActiveSessionId } from '@/lib/sessionHelpers';

// GET /api/sessions/active - Get the currently active session based on cookie
export async function GET() {
  try {
    const sessionId = await getActiveSessionId();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    const result = await sql`
      SELECT id, name, isActive, createdAt, updatedAt, createdAtLocalDate 
      FROM sessions 
      WHERE id = ${sessionId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const session = result.rows[0];

    return NextResponse.json({
      id: session.id,
      name: session.name,
      isActive: session.isactive,
      createdAt: session.createdat,
      updatedAt: session.updatedat,
      createdAtLocalDate: session.createdatlocaldate,
    });
  } catch (error) {
    console.error('Error fetching active session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active session' },
      { status: 500 }
    );
  }
}
