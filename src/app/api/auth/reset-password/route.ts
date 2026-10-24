import { createHash } from 'crypto';
import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invalid reset link' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 },
      );
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const passwordHash = await hashPassword(password);

    const updated = await sql`
      WITH consumed AS (
        UPDATE password_resets
        SET usedAt = NOW()
        WHERE tokenHash = ${tokenHash}
          AND usedAt IS NULL
          AND expiresAt > NOW()
        RETURNING userId
      )
      UPDATE users
      SET passwordHash = ${passwordHash}, updatedAt = CURRENT_TIMESTAMP
      FROM consumed
      WHERE users.id = consumed.userId
      RETURNING users.id
    `;
    if (updated.rows.length === 0) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired' },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: 'Password updated' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 },
    );
  }
}
