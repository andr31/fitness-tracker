import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getActiveSessionId } from '@/lib/sessionHelpers';

export async function POST(
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
      return NextResponse.json(
        { error: 'Invalid player ID format' },
        { status: 400 },
      );
    }

    const { amount, date, dailyGoalTarget } = await request.json();

    // Validate amount - allow decimals, must be a number
    if (typeof amount !== 'number' || isNaN(amount)) {
      return NextResponse.json(
        { error: 'Amount must be a valid number' },
        { status: 400 },
      );
    }

    // For decimal amounts, validate they are multiples of 0.25
    if (!Number.isInteger(amount)) {
      const remainder = (amount * 100) % 25;
      if (remainder !== 0) {
        return NextResponse.json(
          {
            error:
              'Decimal amounts must be in quarter increments (0.25, 0.5, 0.75, etc.)',
          },
          { status: 400 },
        );
      }
    }

    if (typeof dailyGoalTarget !== 'number' || dailyGoalTarget <= 0) {
      return NextResponse.json(
        { error: 'Daily goal target must be a positive number' },
        { status: 400 },
      );
    }

    // Validate date if provided
    if (date !== undefined && date !== null) {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(date)) {
        return NextResponse.json(
          { error: 'Date must be in YYYY-MM-DD format' },
          { status: 400 },
        );
      }
    }

    // Insert daily goal history entry
    if (date) {
      await sql`
        INSERT INTO dailyGoalHistory (playerId, amount, localDate, dailyGoalTarget, sessionId) 
        VALUES (${playerId}, ${amount}, ${date}::DATE, ${dailyGoalTarget}, ${sessionId})
      `;
    } else {
      await sql`
        INSERT INTO dailyGoalHistory (playerId, amount, localDate, dailyGoalTarget, sessionId) 
        VALUES (
          ${playerId}, 
          ${amount}, 
          (CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles')::DATE,
          ${dailyGoalTarget},
          ${sessionId}
        )
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding daily goal entry:', error);
    return NextResponse.json(
      { error: 'Failed to add daily goal entry' },
      { status: 500 },
    );
  }
}

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

    // Get date from query parameter (client's local date) or use server's date as fallback
    const url = new URL(request.url);
    const dateParam = url.searchParams.get('date');

    let todayStr: string;
    if (dateParam) {
      // Use the date provided by the client (their local date)
      todayStr = dateParam;
    } else {
      // Fallback to server's date (but this may be wrong timezone)
      const today = new Date();
      todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    const result = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as total
      FROM dailyGoalHistory
      WHERE playerId = ${playerId} AND sessionId = ${sessionId} AND localDate = ${todayStr}::DATE
    `;

    return NextResponse.json({ total: parseFloat(result.rows[0]?.total) || 0 });
  } catch (error) {
    console.error('Error fetching daily goal progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily goal progress' },
      { status: 500 },
    );
  }
}
