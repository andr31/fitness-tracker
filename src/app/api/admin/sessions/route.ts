import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPassword } from '@/lib/adminAuth';

// POST /api/admin/sessions - List all sessions (active and archived), admin only
export async function POST(request: NextRequest) {
  try {
    const { adminPassword } = await request.json();
    const denied = await checkAdminPassword(adminPassword);
    if (denied) return denied;

    const result = await sql`
      SELECT s.id, s.name, s.createdAt, s.archivedAt, s.sessionType, s.customExerciseName,
        (SELECT MAX(sub.localDate) FROM (
          SELECT ph.localDate FROM pushupHistory ph WHERE ph.sessionId = s.id GROUP BY ph.localDate HAVING SUM(ph.amount) > 0
        ) sub) as lastActivityDate,
        (SELECT COUNT(*) FROM players p WHERE p.sessionId = s.id) as playerCount
      FROM sessions s
      ORDER BY s.createdAt DESC
    `;

    return NextResponse.json(
      result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        createdAt: row.createdat,
        archivedAt: row.archivedat,
        sessionType: row.sessiontype || 'pushups',
        customExerciseName: row.customexercisename || null,
        lastActivityDate: row.lastactivitydate
          ? new Date(row.lastactivitydate).toISOString().split('T')[0]
          : null,
        playerCount: parseInt(row.playercount) || 0,
      })),
    );
  } catch (error) {
    console.error('Admin list sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 },
    );
  }
}
