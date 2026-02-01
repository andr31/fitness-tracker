import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id);

    if (isNaN(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 },
      );
    }

    // Get or generate short code
    let result = await sql`
      SELECT short_code FROM sessions WHERE id = ${sessionId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    let shortCode = result.rows[0].short_code;

    // Generate short code if it doesn't exist
    if (!shortCode) {
      shortCode = generateShortCode();

      // Update session with short code
      await sql`
        UPDATE sessions SET short_code = ${shortCode} WHERE id = ${sessionId}
      `;
    }

    const shareUrl = `${request.nextUrl.origin}/join/${shortCode}`;

    return NextResponse.json({
      shortCode,
      shareUrl,
    });
  } catch (error) {
    console.error('Error generating share link:', error);
    return NextResponse.json(
      { error: 'Failed to generate share link' },
      { status: 500 },
    );
  }
}

function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
