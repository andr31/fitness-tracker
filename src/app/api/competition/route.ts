import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

// GET competition end date
export async function GET() {
  try {
    const result = await sql`
      SELECT endDate FROM competition_settings ORDER BY id DESC LIMIT 1;
    `;
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Competition settings not found' },
        { status: 404 }
      );
    }

    // Return as ISO string but treat as local time (no timezone conversion)
    const dateStr = result.rows[0].enddate;
    return NextResponse.json({ endDate: dateStr });
  } catch (error) {
    console.error('Error fetching competition end date:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competition end date' },
      { status: 500 }
    );
  }
}

// PUT update competition end date
export async function PUT(request: NextRequest) {
  try {
    const { endDate } = await request.json();

    if (!endDate) {
      return NextResponse.json(
        { error: 'End date is required' },
        { status: 400 }
      );
    }

    await sql`
      UPDATE competition_settings 
      SET endDate = ${endDate}, updatedAt = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM competition_settings ORDER BY id DESC LIMIT 1);
    `;

    return NextResponse.json({ success: true, endDate });
  } catch (error) {
    console.error('Error updating competition end date:', error);
    return NextResponse.json(
      { error: 'Failed to update competition end date' },
      { status: 500 }
    );
  }
}
