import { createHash, randomBytes } from 'crypto';
import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/lib/email';

const GENERIC_RESPONSE = {
  message: 'If an account exists for that email, a reset link has been sent.',
};

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const result = await sql`
      SELECT id, email FROM users WHERE email = ${trimmedEmail}
    `;

    // Same response whether or not the account exists, to avoid leaking emails
    if (result.rows.length === 0) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const user = result.rows[0];
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    await sql`DELETE FROM password_resets WHERE userId = ${user.id}`;
    await sql`
      INSERT INTO password_resets (userId, tokenHash, expiresAt)
      VALUES (${user.id}, ${tokenHash}, NOW() + INTERVAL '1 hour')
    `;

    const baseUrl = process.env.APP_URL || request.nextUrl.origin;
    await sendPasswordResetEmail(
      user.email,
      `${baseUrl}/reset-password?token=${token}`,
    );

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return NextResponse.json(
      { error: 'Failed to send reset email' },
      { status: 500 },
    );
  }
}
