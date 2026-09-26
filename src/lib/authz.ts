import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export type AuthzResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

function forbidden(error: string, status: number): AuthzResult {
  return { ok: false, response: NextResponse.json({ error }, { status }) };
}

async function getSessionAuthMode(
  sessionId: number,
): Promise<{ authMode: string } | null> {
  const result = await sql`
    SELECT authMode FROM sessions WHERE id = ${sessionId}
  `;
  if (result.rows.length === 0) return null;
  return { authMode: result.rows[0].authmode || 'open' };
}

/**
 * Ensures the requester owns the given player within the session.
 * In 'open' sessions this always passes (today's behavior, no per-user identity).
 * In 'account' sessions the logged-in user must be the player's linked account,
 * with no admin override -- admins can't edit other players' own data.
 */
export async function requireOwnPlayer(
  sessionId: number,
  playerId: number,
): Promise<AuthzResult> {
  const session = await getSessionAuthMode(sessionId);
  if (!session) return forbidden('Session not found', 404);
  if (session.authMode !== 'account') return { ok: true };

  const user = await getCurrentUser();
  if (!user) return forbidden('Please log in to continue', 401);

  const playerResult = await sql`
    SELECT userId FROM players WHERE id = ${playerId} AND sessionId = ${sessionId}
  `;
  if (playerResult.rows.length === 0) {
    return forbidden('Player not found', 404);
  }

  if (playerResult.rows[0].userid !== user.id) {
    return forbidden('You can only update your own data', 403);
  }

  return { ok: true };
}

/**
 * Ensures the requester is the session admin (session creator's player).
 * In 'open' sessions this always passes (today's behavior).
 */
export async function requireSessionAdmin(
  sessionId: number,
): Promise<AuthzResult> {
  const session = await getSessionAuthMode(sessionId);
  if (!session) return forbidden('Session not found', 404);
  if (session.authMode !== 'account') return { ok: true };

  const user = await getCurrentUser();
  if (!user) return forbidden('Please log in to continue', 401);

  const memberResult = await sql`
    SELECT role FROM players WHERE sessionId = ${sessionId} AND userId = ${user.id}
  `;
  if (memberResult.rows.length === 0) {
    return forbidden('You are not a member of this session', 403);
  }

  if (memberResult.rows[0].role !== 'admin') {
    return forbidden('Only the session admin can do this', 403);
  }

  return { ok: true };
}
