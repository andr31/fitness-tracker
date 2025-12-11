import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { dailyTarget } = body;

    if (dailyTarget === undefined || dailyTarget < 0) {
      return NextResponse.json(
        { error: 'Daily target must be a non-negative number' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE players
      SET dailyTarget = ${dailyTarget}
      WHERE id = ${id}
      RETURNING id, name, totalPushups, dailyTarget
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const player = result.rows[0];
    return NextResponse.json({
      id: player.id,
      name: player.name,
      totalPushups: player.totalpushups,
      dailyTarget: player.dailytarget,
    });
  } catch (error) {
    console.error('Error updating daily target:', error);
    return NextResponse.json(
      { error: 'Failed to update daily target' },
      { status: 500 }
    );
  }
}
