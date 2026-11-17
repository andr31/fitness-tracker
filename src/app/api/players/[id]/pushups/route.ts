import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getActiveSessionId } from '@/lib/sessionHelpers';
import { requireOwnPlayer } from '@/lib/authz';

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

    const authz = await requireOwnPlayer(sessionId, playerId);
    if (!authz.ok) return authz.response;

    const body = await request.json();
    const { amount, date } = body;
    console.log('[API] Request body:', { amount, date, type: typeof amount });

    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      console.log('[API] Invalid amount');
      return NextResponse.json(
        { error: 'Amount must be a valid number' },
        { status: 400 },
      );
    }

    const sessionResult = await sql`
      SELECT sessionType FROM sessions WHERE id = ${sessionId}
    `;
    const sessionType = sessionResult.rows[0]?.sessiontype || 'pushups';

    if (sessionType === 'plank' && !Number.isInteger(amount * 4)) {
      return NextResponse.json(
        { error: 'Plank amounts must use quarter increments' },
        { status: 400 },
      );
    }
    if (sessionType !== 'plank' && !Number.isInteger(amount)) {
      return NextResponse.json(
        { error: 'Rep counts must be whole numbers' },
        { status: 400 },
      );
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

    // The cutoff, total and both history entries must be applied in one statement.
    const result = await sql`
      WITH deadline AS MATERIALIZED (
        SELECT CASE
          WHEN endDate ~ '(Z|[+-][0-9]{2}:[0-9]{2})$' THEN endDate::timestamptz
          ELSE endDate::timestamp AT TIME ZONE 'UTC'
        END AS ends_at
        FROM competition_settings WHERE sessionId = ${sessionId}
        ORDER BY id DESC LIMIT 1
      ),
      target AS MATERIALIZED (
        SELECT id, totalpushups AS old_total FROM players
        WHERE id = ${playerId} AND sessionId = ${sessionId}
        FOR UPDATE
      ),
      updated AS (
        UPDATE players p
        SET totalpushups = GREATEST(0, target.old_total + ${amount}),
            updatedat = CURRENT_TIMESTAMP
        FROM target
        WHERE p.id = target.id
          AND clock_timestamp() < COALESCE(
            (SELECT ends_at FROM deadline), 'infinity'::timestamptz
          )
        RETURNING p.id, p.name, p.totalpushups, p.updatedat, target.old_total
      ),
      entry AS (
        SELECT updated.*, totalpushups - old_total AS delta,
          COALESCE(${date ?? null}::date, (CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles')::date) AS activity_date
        FROM updated
      ),
      history AS (
        INSERT INTO pushupHistory (playerId, amount, localDate, sessionId)
        SELECT id, delta, activity_date, ${sessionId} FROM entry
      ),
      goal_entry AS (
        SELECT entry.*,
          CASE WHEN delta < 0 THEN GREATEST(delta, -COALESCE((
            SELECT SUM(amount) FROM dailyGoalHistory
            WHERE playerId = entry.id AND sessionId = ${sessionId}
              AND localDate = entry.activity_date
          ), 0)) ELSE delta END AS goal_delta,
          COALESCE((SELECT NULLIF(dailyGoal, 0) FROM dailyGoalSettings
            WHERE playerId = entry.id AND sessionId = ${sessionId} LIMIT 1), 100) AS goal_target
        FROM entry
      ),
      goal_history AS (
        INSERT INTO dailyGoalHistory (playerId, amount, localDate, dailyGoalTarget, sessionId)
        SELECT id, goal_delta, activity_date, goal_target, ${sessionId}
        FROM goal_entry WHERE goal_delta <> 0
      )
      SELECT * FROM entry
    `;

    if (!result.rows || result.rows.length === 0) {
      const player = await sql`
        SELECT id FROM players WHERE id = ${playerId} AND sessionId = ${sessionId}
      `;
      if (player.rows.length === 0) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Competition ended. Exercise entries are locked.' },
        { status: 409 },
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
