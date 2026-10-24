import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPassword } from '@/lib/adminAuth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/sessions/[id]/restore - Bring an archived session back
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
      UPDATE sessions SET archivedAt = NULL
      WHERE id = ${sessionId} AND archivedAt IS NOT NULL
      RETURNING name
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Session not found or not archived' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Session "${result.rows[0].name}" restored`,
    });
  } catch (error) {
    console.error('Error restoring session:', error);
    return NextResponse.json(
      { error: 'Failed to restore session' },
      { status: 500 },
    );
  }
}
