import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';

// Admin password hash - change this in production
const ADMIN_PASSWORD = 'adm2026';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    const body = await request.json();
    const { adminPassword } = body;

    if (!adminPassword) {
      return NextResponse.json({ error: 'Admin password required' }, { status: 401 });
    }

    // Verify admin password
    if (adminPassword !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 403 });
    }

    // Check if session exists
    const session = await sql`
      SELECT id, name, isActive FROM sessions WHERE id = ${sessionId}
    `;

    if (session.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Prevent deletion of active session
    if (session.rows[0].isActive) {
      return NextResponse.json(
        { error: 'Cannot delete active session. Please switch to another session first.' },
        { status: 400 }
      );
    }

    // Delete the session (cascade will handle related data)
    await sql`DELETE FROM sessions WHERE id = ${sessionId}`;

    return NextResponse.json({
      message: 'Session deleted successfully',
      sessionId,
    });
  } catch (error: unknown) {
    console.error('Delete session error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete session';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
