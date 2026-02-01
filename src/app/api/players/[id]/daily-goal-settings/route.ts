import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getActiveSessionId } from '@/lib/sessionHelpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const sessionId = await getActiveSessionId();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No active session. Please select a session first.' },
        { status: 401 },
      );
    }

    const playerId = parseInt(id, 10);

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
    }

    const result = await sql`
      SELECT dailyGoal FROM dailyGoalSettings WHERE playerId = ${playerId} AND sessionId = ${sessionId}
    `;

    if (result.rows.length === 0) {
      // Fetch session type to determine default
      const sessionResult = await sql`
        SELECT sessionType FROM sessions WHERE id = ${sessionId}
      `;
      const sessionType = sessionResult.rows[0]?.sessiontype || 'pushups';
      const defaultGoal = sessionType === 'plank' ? 5 : 100;

      // Create default if doesn't exist
      await sql`
        INSERT INTO dailyGoalSettings (playerId, dailyGoal, sessionId)
        VALUES (${playerId}, ${defaultGoal}, ${sessionId})
      `;
      return NextResponse.json({ dailyGoal: defaultGoal });
    }

    return NextResponse.json({ dailyGoal: result.rows[0].dailygoal });
  } catch (error) {
    console.error('Error fetching daily goal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily goal' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const sessionId = await getActiveSessionId();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No active session. Please select a session first.' },
        { status: 401 },
      );
    }

    const playerId = parseInt(id, 10);

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
    }

    const { dailyGoal } = await request.json();

    if (typeof dailyGoal !== 'number' || dailyGoal < 1) {
      return NextResponse.json(
        { error: 'Daily goal must be a positive number' },
        { status: 400 },
      );
    }

    await sql`
      INSERT INTO dailyGoalSettings (playerId, dailyGoal, updatedAt, sessionId)
      VALUES (${playerId}, ${dailyGoal}, CURRENT_TIMESTAMP, ${sessionId})
      ON CONFLICT (playerId, sessionId) 
      DO UPDATE SET dailyGoal = ${dailyGoal}, updatedAt = CURRENT_TIMESTAMP
    `;

    return NextResponse.json({ dailyGoal });
  } catch (error) {
    console.error('Error updating daily goal:', error);
    return NextResponse.json(
      { error: 'Failed to update daily goal' },
      { status: 500 },
    );
  }
}
