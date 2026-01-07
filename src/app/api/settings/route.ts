import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getActiveSessionId } from '@/lib/sessionHelpers';

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
      SELECT key, value 
      FROM settings
      WHERE sessionId = ${sessionId}
    `;

    const settings: Record<string, string> = {};
    result.rows.forEach((row) => {
      settings[row.key as string] = row.value as string;
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionId = await getActiveSessionId();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No active session. Please select a session first.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO settings (key, value, sessionId)
      VALUES (${key}, ${value}, ${sessionId})
      ON CONFLICT (key, sessionId) 
      DO UPDATE SET value = ${value}, updatedAt = CURRENT_TIMESTAMP
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}
