import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const playerId = parseInt(id, 10);

    if (isNaN(playerId)) {
      return NextResponse.json(
        { error: 'Invalid player ID format' },
        { status: 400 }
      );
    }

    const { amount, date, dailyGoalTarget } = await request.json();

    if (typeof amount !== 'number' || !Number.isInteger(amount)) {
      return NextResponse.json(
        { error: 'Amount must be an integer' },
        { status: 400 }
      );
    }

    if (typeof dailyGoalTarget !== 'number' || !Number.isInteger(dailyGoalTarget) || dailyGoalTarget <= 0) {
      return NextResponse.json(
        { error: 'Daily goal target must be a positive integer' },
        { status: 400 }
      );
    }

    // Validate date if provided
    if (date !== undefined && date !== null) {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(date)) {
        return NextResponse.json(
          { error: 'Date must be in YYYY-MM-DD format' },
          { status: 400 }
        );
      }
    }

    // Insert daily goal history entry
    if (date) {
      await sql`
        INSERT INTO dailyGoalHistory (playerId, amount, localDate, dailyGoalTarget) 
        VALUES (${playerId}, ${amount}, ${date}::DATE, ${dailyGoalTarget})
      `;
    } else {
      await sql`
        INSERT INTO dailyGoalHistory (playerId, amount, localDate, dailyGoalTarget) 
        VALUES (
          ${playerId}, 
          ${amount}, 
          (CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles')::DATE,
          ${dailyGoalTarget}
        )
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding daily goal entry:', error);
    return NextResponse.json(
      { error: 'Failed to add daily goal entry' },
      { status: 500 }
    );
  }
}

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
        COALESCE(SUM(amount), 0)::integer as total
      FROM dailyGoalHistory
      WHERE playerId = ${playerId} AND localDate = ${todayStr}::DATE
    `;

    return NextResponse.json({ total: result.rows[0].total });
  } catch (error) {
    console.error('Error fetching daily goal progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily goal progress' },
      { status: 500 }
    );
  }
}
