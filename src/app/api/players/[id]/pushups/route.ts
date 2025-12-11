import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    if (!id || id === 'undefined') {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    const playerId = parseInt(id, 10);

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID format' }, { status: 400 });
    }

    const { amount } = await request.json();

    if (typeof amount !== 'number' || !Number.isInteger(amount)) {
      return NextResponse.json(
        { error: 'Amount must be an integer' },
        { status: 400 }
      );
    }

    // Check if player exists and get current total
    const playerResult = await sql`
      SELECT id, "totalPushups" FROM players WHERE id = ${playerId}
    `;

    if (!playerResult.rows || playerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const player = playerResult.rows[0];
    const newTotal = player.totalPushups + amount;

    if (newTotal < 0) {
      return NextResponse.json(
        { error: 'Total pushups cannot be negative' },
        { status: 400 }
      );
    }

    // Insert history
    await sql`
      INSERT INTO pushupHistory (playerId, amount) 
      VALUES (${playerId}, ${amount})
    `;

    // Update player total
    const result = await sql`
      UPDATE players 
      SET "totalPushups" = ${newTotal}, "updatedAt" = CURRENT_TIMESTAMP 
      WHERE id = ${playerId}
      RETURNING id, name, "totalPushups", "updatedAt"
    `;

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating pushups:', error);
    return NextResponse.json(
      { error: 'Failed to update pushups' },
      { status: 500 }
    );
  }
}
