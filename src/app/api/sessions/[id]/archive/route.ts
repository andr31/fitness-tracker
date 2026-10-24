import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPassword } from '@/lib/adminAuth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/sessions/[id]/archive - Hide a session; all data is kept so it can be restored
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const sessionId = parseInt((await params).id);
    if (isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    const { adminPassword } = await request.json();
    const denied = await checkAdminPassword(adminPassword);
    if (denied) return denied;

    const result = await sql`
      UPDATE sessions SET archivedAt = CURRENT_TIMESTAMP, isActive = false
      WHERE id = ${sessionId} AND archivedAt IS NULL
      RETURNING name
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Session not found or already archived' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Session "${result.rows[0].name}" archived`,
    });
  } catch (error) {
    console.error('Error archiving session:', error);
    return NextResponse.json(
      { error: 'Failed to archive session' },
      { status: 500 },
    );
  }
}
