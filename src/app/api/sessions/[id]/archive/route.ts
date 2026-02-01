import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/sessions/[id]/archive - Archive current session data to history
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 },
      );
    }

    // Get admin password from request body
    const body = await request.json();
    const { adminPassword } = body;

    if (!adminPassword) {
      return NextResponse.json(
        { error: 'Admin password is required' },
        { status: 401 },
      );
    }

    // Fetch admin password from database (global setting)
    const adminPasswordResult = await sql`
      SELECT value FROM settings WHERE key = 'adminPassword' LIMIT 1
    `;

    if (adminPasswordResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Admin password not configured' },
        { status: 500 },
      );
    }

    const hashedAdminPassword = adminPasswordResult.rows[0].value as string;

    // Verify admin password
    const isPasswordValid = await bcrypt.compare(
      adminPassword,
      hashedAdminPassword,
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid admin password' },
        { status: 403 },
      );
    }

    // Verify session exists
    const sessionResult = await sql`
      SELECT id, name FROM sessions WHERE id = ${sessionId}
    `;

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionResult.rows[0];

    // Archive players data
    const playersData = await sql`
      SELECT id, name, totalPushups, createdAt, updatedAt 
      FROM players 
      WHERE sessionId = ${sessionId}
    `;

    if (playersData.rows.length > 0) {
      await sql`
        INSERT INTO session_history (sessionId, snapshotType, data)
        VALUES (${sessionId}, 'players', ${JSON.stringify(playersData.rows)})
      `;
    }

    // Archive pushup history
    const pushupHistoryData = await sql`
      SELECT id, playerId, amount, timestamp 
      FROM pushupHistory 
      WHERE sessionId = ${sessionId}
    `;

    if (pushupHistoryData.rows.length > 0) {
      await sql`
        INSERT INTO session_history (sessionId, snapshotType, data)
        VALUES (${sessionId}, 'pushupHistory', ${JSON.stringify(pushupHistoryData.rows)})
      `;
    }

    // Archive daily goal settings
    const dailyGoalSettingsData = await sql`
      SELECT playerId, dailyGoal, updatedAt 
      FROM dailyGoalSettings 
      WHERE sessionId = ${sessionId}
    `;

    if (dailyGoalSettingsData.rows.length > 0) {
      await sql`
        INSERT INTO session_history (sessionId, snapshotType, data)
        VALUES (${sessionId}, 'dailyGoalSettings', ${JSON.stringify(dailyGoalSettingsData.rows)})
      `;
    }

    // Archive daily goal history
    const dailyGoalHistoryData = await sql`
      SELECT id, playerId, amount, localDate, timestamp 
      FROM dailyGoalHistory 
      WHERE sessionId = ${sessionId}
    `;

    if (dailyGoalHistoryData.rows.length > 0) {
      await sql`
        INSERT INTO session_history (sessionId, snapshotType, data)
        VALUES (${sessionId}, 'dailyGoalHistory', ${JSON.stringify(dailyGoalHistoryData.rows)})
      `;
    }

    // Archive settings
    const settingsData = await sql`
      SELECT id, key, value, updatedAt 
      FROM settings 
      WHERE sessionId = ${sessionId}
    `;

    if (settingsData.rows.length > 0) {
      await sql`
        INSERT INTO session_history (sessionId, snapshotType, data)
        VALUES (${sessionId}, 'settings', ${JSON.stringify(settingsData.rows)})
      `;
    }

    // Archive competition settings
    const competitionData = await sql`
      SELECT id, endDate, updatedAt 
      FROM competition_settings 
      WHERE sessionId = ${sessionId}
    `;

    if (competitionData.rows.length > 0) {
      await sql`
        INSERT INTO session_history (sessionId, snapshotType, data)
        VALUES (${sessionId}, 'competition_settings', ${JSON.stringify(competitionData.rows)})
      `;
    }

    return NextResponse.json({
      success: true,
      message: `Session "${session.name}" data archived successfully`,
      archivedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error archiving session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to archive session' },
      { status: 500 },
    );
  }
}
