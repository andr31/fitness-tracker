import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/sessions/[id]/activate - Activate a session with password
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id);
    
    if (isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    const { password } = await request.json();

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Get session and verify password
    const sessionResult = await sql`
      SELECT id, name, passwordHash, isActive 
      FROM sessions 
      WHERE id = ${sessionId}
    `;

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionResult.rows[0];
    const passwordMatch = await bcrypt.compare(password, session.passwordhash);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Set cookie with session ID (no database isActive update needed - each user has their own cookie)
    const cookieStore = await cookies();
    cookieStore.set('activeSessionId', sessionId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        name: session.name,
        isActive: true,
      }
    });
  } catch (error: any) {
    console.error('Error activating session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to activate session' },
      { status: 500 }
    );
  }
}
