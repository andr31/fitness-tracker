import { createHash, createHmac, randomBytes } from 'crypto';
import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/lib/email';

const GENERIC_RESPONSE = {
  message: 'If an account exists for that email, a reset link has been sent.',
};
const ACCOUNT_REQUEST_LIMIT = 3;
const IP_REQUEST_LIMIT = 10;

function hashRateLimitKey(value: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is not set');
  }
  return createHmac('sha256', secret).update(value).digest('hex');
}

async function isRateLimited(keyHash: string, limit: number): Promise<boolean> {
  const result = await sql`
    INSERT INTO password_reset_rate_limits (
      keyHash,
      windowStartedAt,
      requestCount
    )
    VALUES (${keyHash}, NOW(), 1)
    ON CONFLICT (keyHash) DO UPDATE
    SET
      windowStartedAt = CASE
        WHEN password_reset_rate_limits.windowStartedAt <= NOW() - INTERVAL '1 hour'
          THEN NOW()
        ELSE password_reset_rate_limits.windowStartedAt
      END,
      requestCount = CASE
        WHEN password_reset_rate_limits.windowStartedAt <= NOW() - INTERVAL '1 hour'
          THEN 1
        ELSE LEAST(password_reset_rate_limits.requestCount + 1, ${limit + 1})
      END
    RETURNING requestCount
  `;

  return Number(result.rows[0].requestcount) > limit;
}

function getClientIp(request: NextRequest): string | null {
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const forwardedIp = request.headers
    .get('x-forwarded-for')
    ?.split(',')[0]
    .trim();
  return forwardedIp || null;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail.length > 320) {
      return NextResponse.json({ error: 'Email is too long' }, { status: 400 });
    }

    await sql`
      DELETE FROM password_reset_rate_limits
      WHERE windowStartedAt < NOW() - INTERVAL '24 hours'
    `;

    const accountKey = hashRateLimitKey(`email:${trimmedEmail}`);
    const clientIp = getClientIp(request);
    const accountLimited = await isRateLimited(
      accountKey,
      ACCOUNT_REQUEST_LIMIT,
    );
    const ipLimited = clientIp
      ? await isRateLimited(hashRateLimitKey(`ip:${clientIp}`), IP_REQUEST_LIMIT)
      : false;

    if (accountLimited || ipLimited) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

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

    await sql`
      INSERT INTO password_resets (userId, tokenHash, expiresAt)
      VALUES (${user.id}, ${tokenHash}, NOW() + INTERVAL '1 hour')
      ON CONFLICT (userId) DO UPDATE
      SET
        tokenHash = EXCLUDED.tokenHash,
        expiresAt = EXCLUDED.expiresAt,
        usedAt = NULL,
        createdAt = NOW()
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
