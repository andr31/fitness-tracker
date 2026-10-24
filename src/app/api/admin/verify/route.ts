import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { adminPassword } = await request.json();
    if (!adminPassword) {
      return NextResponse.json(
        { error: 'Admin password required' },
        { status: 401 },
      );
    }

    const result = await sql`
      SELECT value FROM settings WHERE key = 'adminPassword' LIMIT 1
    `;
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Admin password not configured' },
        { status: 500 },
      );
    }

    const valid = await bcrypt.compare(
      adminPassword,
      result.rows[0].value as string,
    );
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid admin password' },
        { status: 403 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
