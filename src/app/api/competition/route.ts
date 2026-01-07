import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { getActiveSessionId } from '@/lib/sessionHelpers';

// GET competition end date
export async function GET() {
  try {
    const sessionId = await getActiveSessionId();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No active session. Please select a session first.' },
        { status: 401 }
      );
    }

    const result = await sql`
      SELECT endDate FROM competition_settings 
      WHERE sessionId = ${sessionId}
      ORDER BY id DESC LIMIT 1;
    `;
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Competition settings not found' },
        { status: 404 }
      );
    }

    // Return endDate as-is (stored as local datetime string without timezone)
    return NextResponse.json({ endDate: result.rows[0].enddate });
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
    const sessionId = await getActiveSessionId();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No active session. Please select a session first.' },
        { status: 401 }
      );
    }

    const { endDate } = await request.json();

    if (!endDate) {
      return NextResponse.json(
        { error: 'End date is required' },
        { status: 400 }
      );
    }

    // Check if competition_settings exists for this session
    const existing = await sql`
      SELECT id FROM competition_settings WHERE sessionId = ${sessionId} LIMIT 1;
    `;

    if (existing.rows.length === 0) {
      // Create new entry for this session
      await sql`
        INSERT INTO competition_settings (endDate, sessionId)
        VALUES (${endDate}, ${sessionId});
      `;
    } else {
      // Update existing entry
      await sql`
        UPDATE competition_settings 
        SET endDate = ${endDate}, updatedAt = CURRENT_TIMESTAMP
        WHERE sessionId = ${sessionId};
      `;
    }

    return NextResponse.json({ success: true, endDate });
  } catch (error) {
    console.error('Error updating competition end date:', error);
    return NextResponse.json(
      { error: 'Failed to update competition end date' },
      { status: 500 }
    );
  }
}
