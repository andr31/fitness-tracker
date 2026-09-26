import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, signAuthToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || typeof email !== 'string' || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    const result = await sql`
      SELECT id, email, passwordHash, displayName FROM users WHERE email = ${trimmedEmail}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    const user = result.rows[0];
    const passwordMatch = await verifyPassword(password, user.passwordhash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    const token = await signAuthToken({
      id: user.id,
      email: user.email,
      displayName: user.displayname,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      displayName: user.displayname,
    });
  } catch (error: unknown) {
    console.error('Error logging in:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to log in';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
