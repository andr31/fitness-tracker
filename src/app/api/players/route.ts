import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`
      SELECT id, name, totalPushups, createdAt, updatedAt 
      FROM players 
      ORDER BY totalPushups DESC
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();

    const result = await sql`
      INSERT INTO players (name, totalPushups) 
      VALUES (${trimmedName}, 0)
      RETURNING id, name, totalPushups, createdAt, updatedAt
    `;

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating player:', error);
    if (error.message?.includes('duplicate key') || error.code === '23505') {
      return NextResponse.json(
        { error: 'Player name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}
