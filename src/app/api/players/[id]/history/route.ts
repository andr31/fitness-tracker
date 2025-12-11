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
        { error: 'Invalid player ID format' },
        { status: 400 }
      );
    }

    // Get daily aggregated pushup history
    const result = await sql`
      SELECT 
        TO_CHAR(timestamp, 'YYYY-MM-DD') as date,
        SUM(amount)::integer as total,
        COUNT(*)::integer as entries
      FROM pushupHistory
      WHERE playerId = ${playerId}
      GROUP BY TO_CHAR(timestamp, 'YYYY-MM-DD')
      ORDER BY TO_CHAR(timestamp, 'YYYY-MM-DD') DESC
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
