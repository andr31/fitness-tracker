import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getActiveSessionId } from '@/lib/sessionHelpers';

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
