import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getActiveSessionId } from '@/lib/sessionHelpers';

// Helper to transform lowercase column names to camelCase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    totalPushups: row.totalpushups,
    updatedAt: row.updatedat,
  };
}

export async function POST(
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

    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }

    const playerId = parseInt(id, 10);

    if (isNaN(playerId)) {
      return NextResponse.json(
        { error: 'Invalid player ID format' },
        { status: 400 }
      );
    }

    const { amount, date } = await request.json();

    if (typeof amount !== 'number' || !Number.isInteger(amount)) {
      return NextResponse.json(
        { error: 'Amount must be an integer' },
        { status: 400 }
      );
    }

    // Validate date if provided (format: YYYY-MM-DD)
    if (date !== undefined && date !== null) {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(date)) {
        return NextResponse.json(
          { error: 'Date must be in YYYY-MM-DD format' },
          { status: 400 }
        );
      }
    }

    // Check if player exists and get current total
    const playerResult = await sql`
      SELECT id, totalpushups FROM players WHERE id = ${playerId} AND sessionId = ${sessionId}
    `;

    if (!playerResult.rows || playerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const player = playerResult.rows[0];
    const newTotal = player.totalpushups + amount;

    if (newTotal < 0) {
      return NextResponse.json(
        { error: 'Total pushups cannot be negative' },
        { status: 400 }
      );
    }

    // Get player's current daily goal setting
    const dailyGoalResult = await sql`
      SELECT dailyGoal FROM dailyGoalSettings WHERE playerId = ${playerId} AND sessionId = ${sessionId}
    `;
    const dailyGoalTarget = dailyGoalResult.rows.length > 0 
      ? dailyGoalResult.rows[0].dailygoal 
      : 100;

    // For removals (negative amounts), check current daily goal progress to prevent negative values
    let dailyGoalAmount = amount;
    if (amount < 0) {
      const progressResult = date
        ? await sql`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM dailyGoalHistory
            WHERE playerId = ${playerId} AND sessionId = ${sessionId} AND localDate = ${date}::DATE
          `
        : await sql`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM dailyGoalHistory
            WHERE playerId = ${playerId} AND sessionId = ${sessionId} AND localDate = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles')::DATE
          `;
      const currentProgress = progressResult.rows[0]?.total || 0;
      // Only remove up to current progress (don't go below 0)
      dailyGoalAmount = Math.max(amount, -currentProgress);
    }

    // Insert history with either provided date or auto-calculated PST date
    if (date) {
      await sql`
        INSERT INTO pushupHistory (playerId, amount, localDate, sessionId) 
        VALUES (${playerId}, ${amount}, ${date}::DATE, ${sessionId})
      `;
      // Also update daily goal history with the same date, but cap removal at 0
      if (dailyGoalAmount !== 0) {
        await sql`
          INSERT INTO dailyGoalHistory (playerId, amount, localDate, dailyGoalTarget, sessionId) 
          VALUES (${playerId}, ${dailyGoalAmount}, ${date}::DATE, ${dailyGoalTarget}, ${sessionId})
        `;
      }
    } else {
      await sql`
        INSERT INTO pushupHistory (playerId, amount, localDate, sessionId) 
        VALUES (
          ${playerId}, 
          ${amount}, 
          (CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles')::DATE,
          ${sessionId}
        )
      `;
      // Also update daily goal history, but cap removal at 0
      if (dailyGoalAmount !== 0) {
        await sql`
          INSERT INTO dailyGoalHistory (playerId, amount, localDate, dailyGoalTarget, sessionId) 
          VALUES (
            ${playerId}, 
            ${dailyGoalAmount}, 
            (CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles')::DATE,
            ${dailyGoalTarget},
            ${sessionId}
          )
        `;
      }
    }

    // Update player total
    const result = await sql`
      UPDATE players 
      SET totalpushups = ${newTotal}, updatedat = CURRENT_TIMESTAMP 
      WHERE id = ${playerId}
      RETURNING id, name, totalpushups, updatedat
    `;

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update player' },
        { status: 500 }
      );
    }

    return NextResponse.json(transformRow(result.rows[0]));
  } catch (error) {
    console.error('Error updating pushups:', error);
    return NextResponse.json(
      { error: 'Failed to update pushups' },
      { status: 500 }
    );
  }
}
