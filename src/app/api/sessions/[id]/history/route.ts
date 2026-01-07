import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/sessions/[id]/history - Get archived history for a session
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id);
    
    if (isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    // Verify session exists
    const sessionResult = await sql`
      SELECT id, name FROM sessions WHERE id = ${sessionId}
    `;

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get all history snapshots for this session
    const historyResult = await sql`
      SELECT id, snapshotType, data, createdAt 
      FROM session_history 
      WHERE sessionId = ${sessionId}
      ORDER BY createdAt DESC
    `;

    return NextResponse.json({
      sessionId,
      sessionName: sessionResult.rows[0].name,
      snapshots: historyResult.rows.map(row => ({
        id: row.id,
        type: row.snapshottype,
        data: row.data,
        createdAt: row.createdat,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching session history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch session history' },
      { status: 500 }
    );
  }
}
