import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const playerId = parseInt(id, 10);

    if (isNaN(playerId)) {
      return NextResponse.json(
        { error: 'Invalid player ID' },
        { status: 400 }
      );
    }

    // Get the player's daily goal setting
    const goalResult = await sql`
      SELECT dailyGoal 
      FROM dailyGoalSettings 
      WHERE playerId = ${playerId}
    `;

    if (goalResult.rows.length === 0) {
      return NextResponse.json({ 
        goalsMet: 0, 
        days: [] 
      });
    }

    const dailyGoal = goalResult.rows[0].dailygoal;

    // Get all days where the daily goal was met
    const result = await sql`
      SELECT 
        localDate::text as date,
        SUM(amount) as total
      FROM dailyGoalHistory
      WHERE playerId = ${playerId}
      GROUP BY localDate
      HAVING SUM(amount) >= ${dailyGoal}
      ORDER BY localDate DESC
    `;

    return NextResponse.json({
      goalsMet: result.rows.length,
      dailyGoal,
      days: result.rows.map(row => ({
        date: row.date,
        total: parseInt(row.total, 10)
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
