import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getActiveSessionId } from '@/lib/sessionHelpers';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const sessionId = await getActiveSessionId();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No active session. Please select a session first.' },
        { status: 401 }
      );
    }

    const playerId = parseInt(id, 10);

    if (isNaN(playerId) || !id) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
    }

    const sessionResult = await sql`
      SELECT authMode FROM sessions WHERE id = ${sessionId}
    `;
    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (sessionResult.rows[0].authmode === 'account') {
      // Account-based sessions: a member can only remove themselves;
      // the session admin can remove any player (kick).
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return NextResponse.json(
          { error: 'Please log in to continue' },
          { status: 401 },
        );
      }

      const targetPlayer = await sql`
        SELECT userId FROM players WHERE id = ${playerId} AND sessionId = ${sessionId}
      `;
      if (targetPlayer.rows.length === 0) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }

      const isSelf = targetPlayer.rows[0].userid === currentUser.id;
      if (!isSelf) {
        const requester = await sql`
          SELECT role FROM players WHERE sessionId = ${sessionId} AND userId = ${currentUser.id}
        `;
        const isAdmin = requester.rows[0]?.role === 'admin';
        if (!isAdmin) {
          return NextResponse.json(
            { error: 'You can only remove yourself from this session' },
            { status: 403 },
          );
        }
      }
    }

    const result = await sql`
      DELETE FROM players WHERE id = ${playerId} AND sessionId = ${sessionId}
    `;

    if (!result.rowCount || result.rowCount === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    );
  }
}
