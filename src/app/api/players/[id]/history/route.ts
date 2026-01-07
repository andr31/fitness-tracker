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
        { error: 'Invalid player ID format' },
        { status: 400 }
      );
    }


    // Get daily aggregated pushup history using localDate (PST timezone)
    // Count additions and removals separately
    const result = await sql`
      SELECT 
        localDate::TEXT as date,
        SUM(amount)::integer as total,
        COUNT(*) FILTER (WHERE amount > 0)::integer as additions,
        COUNT(*) FILTER (WHERE amount < 0)::integer as removals
      FROM pushupHistory
      WHERE playerId = ${playerId} AND sessionId = ${sessionId}
      GROUP BY localDate
      ORDER BY localDate DESC
      LIMIT 30
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
