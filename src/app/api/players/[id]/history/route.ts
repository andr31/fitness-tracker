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
        DATE(timestamp) as date,
        SUM(amount) as total,
        COUNT(*) as entries
      FROM pushupHistory
      WHERE playerId = ${playerId}
      GROUP BY DATE(timestamp)
      ORDER BY DATE(timestamp) DESC
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
