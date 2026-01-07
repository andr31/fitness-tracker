import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getActiveSessionId } from '@/lib/sessionHelpers';

export async function GET(
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

    if (isNaN(playerId)) {
      return NextResponse.json(
        { error: 'Invalid player ID' },
        { status: 400 }
      );
    }

    // Get all days where the daily goal was met (comparing against the last target set that day)
    // We use ARRAY_AGG with ORDER BY timestamp DESC to get the most recent target
    const result = await sql`
      SELECT 
        localDate::text as date,
        SUM(amount) as total,
        (ARRAY_AGG(dailyGoalTarget ORDER BY timestamp DESC))[1] as dailyGoalTarget
      FROM dailyGoalHistory
      WHERE playerId = ${playerId} AND sessionId = ${sessionId}
      GROUP BY localDate
      HAVING SUM(amount) >= (ARRAY_AGG(dailyGoalTarget ORDER BY timestamp DESC))[1]
      ORDER BY localDate DESC
    `;

    // Get current daily goal for reference
    const goalResult = await sql`
      SELECT dailyGoal 
      FROM dailyGoalSettings 
      WHERE playerId = ${playerId} AND sessionId = ${sessionId}
    `;
    
    const currentDailyGoal = goalResult.rows.length > 0 ? goalResult.rows[0].dailygoal : 100;

    return NextResponse.json({
      goalsMet: result.rows.length,
      dailyGoal: currentDailyGoal,
      days: result.rows.map(row => ({
        date: row.date,
        total: parseInt(row.total, 10),
        target: parseInt(row.dailygoaltarget, 10)
      }))
    });

  } catch (error) {
    console.error('Error fetching daily goal stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily goal stats' },
      { status: 500 }
    );
  }
}
