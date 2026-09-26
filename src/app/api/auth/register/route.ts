import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, signAuthToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.trim().toLowerCase();
    if (!emailPattern.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 },
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 },
      );
    }

    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 },
      );
    }
    const trimmedDisplayName = displayName.trim();

    const existing = await sql`
      SELECT id FROM users WHERE email = ${trimmedEmail}
    `;
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const result = await sql`
      INSERT INTO users (email, passwordHash, displayName)
      VALUES (${trimmedEmail}, ${passwordHash}, ${trimmedDisplayName})
      RETURNING id, email, displayName
    `;
    const newUser = result.rows[0];

    const token = await signAuthToken({
      id: newUser.id,
      email: newUser.email,
      displayName: newUser.displayname,
    });
    await setAuthCookie(token);

    return NextResponse.json(
      {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayname,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error('Error registering user:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to register';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
