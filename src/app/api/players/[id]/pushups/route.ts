import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getActiveSessionId } from '@/lib/sessionHelpers';

// Helper to transform lowercase column names to camelCase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    totalPushups: parseFloat(row.totalpushups) || 0,
    updatedAt: row.updatedat,
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    console.log('[API] Starting POST request for player:', id);
    const sessionId = await getActiveSessionId();

    if (!sessionId) {
      console.log('[API] No active session');
      return NextResponse.json(
        { error: 'No active session. Please select a session first.' },
        { status: 401 },
      );
    }

    if (!id || id === 'undefined') {
      console.log('[API] Invalid player ID');
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 },
      );
    }

    const playerId = parseInt(id, 10);

    if (isNaN(playerId)) {
      console.log('[API] Player ID is NaN');
      return NextResponse.json(
        { error: 'Invalid player ID format' },
        { status: 400 },
      );
    }

    const body = await request.json();
    let { amount, date } = body;
    console.log('[API] Request body:', { amount, date, type: typeof amount });

    // Validate amount - allow decimals for plank sessions, must be a number
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.log('[API] Invalid amount');
      return NextResponse.json(
        { error: 'Amount must be a valid number' },
        { status: 400 },
      );
    }

    // For plank sessions, validate that decimal values are multiples of 0.25
    if (!Number.isInteger(amount)) {
      // Check if it's a valid quarter increment (multiple of 0.25)
      const remainder = (amount * 100) % 25; // Multiply by 100 to avoid floating point issues
      if (remainder !== 0) {
        console.log('[API] Invalid quarter increment:', amount);
        return NextResponse.json(
          {
            error:
              'Decimal amounts must be in quarter increments (0.25, 0.5, 0.75, etc.)',
          },
          { status: 400 },
        );
      }
    }

    // Validate date if provided (format: YYYY-MM-DD)
    if (date !== undefined && date !== null) {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(date)) {
        return NextResponse.json(
          { error: 'Date must be in YYYY-MM-DD format' },
          { status: 400 },
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
    // Convert totalpushups to number (it comes as string from NUMERIC columns)
    const currentTotal = parseFloat(player.totalpushups) || 0;
    let newTotal = currentTotal + amount;

    // Cap at 0 instead of allowing negative values
    if (newTotal < 0) {
      newTotal = 0;
      // Adjust amount to only remove what's available
      amount = -currentTotal;
    }

    // Get player's current daily goal setting
    const dailyGoalResult = await sql`
      SELECT dailyGoal FROM dailyGoalSettings WHERE playerId = ${playerId} AND sessionId = ${sessionId}
    `;
    const dailyGoalTarget =
      dailyGoalResult.rows.length > 0
        ? parseFloat(dailyGoalResult.rows[0].dailygoal) || 100
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
      const currentProgress = parseFloat(progressResult.rows[0]?.total) || 0;
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
        { status: 500 },
      );
    }

    return NextResponse.json(transformRow(result.rows[0]));
  } catch (error) {
    console.error('Error updating pushups:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      {
        error: 'Failed to update pushups',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
