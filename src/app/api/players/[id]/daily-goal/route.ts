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

    const { amount, date } = await request.json();

    if (typeof amount !== 'number' || !Number.isInteger(amount)) {
      return NextResponse.json(
        { error: 'Amount must be an integer' },
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
        INSERT INTO dailyGoalHistory (playerId, amount, localDate) 
        VALUES (${playerId}, ${amount}, ${date}::DATE)
      `;
    } else {
      await sql`
        INSERT INTO dailyGoalHistory (playerId, amount, localDate) 
        VALUES (
          ${playerId}, 
          ${amount}, 
          (CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles')::DATE
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

    // Get today's total
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

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
