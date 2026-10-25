import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';

/**
 * Get the active session ID from cookies, unless the session is archived.
 */
export async function getActiveSessionId(): Promise<number | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('activeSessionId')?.value;
  if (!sessionId) return null;

  const parsedSessionId = Number.parseInt(sessionId, 10);
  if (!Number.isInteger(parsedSessionId)) return null;

  const result = await sql`
    SELECT id, authMode FROM sessions
    WHERE id = ${parsedSessionId} AND archivedAt IS NULL
  `;
  if (result.rows.length === 0) return null;

  // Account sessions require a logged-in user even if the cookie is still set
  if (result.rows[0].authmode === 'account' && !(await getCurrentUser())) {
    return null;
  }

  return parsedSessionId;
}

/**
 * Set the active session ID in cookies
 * @param sessionId The session ID to set as active
 */
export async function setActiveSessionId(sessionId: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('activeSessionId', sessionId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

const KNOWN_SESSIONS_COOKIE = 'knownSessionIds';
const MAX_KNOWN_SESSIONS = 50;

/**
 * Session IDs this browser has unlocked or created (including the current active one).
 */
export async function getKnownSessionIds(): Promise<number[]> {
  const cookieStore = await cookies();
  const ids = (cookieStore.get(KNOWN_SESSIONS_COOKIE)?.value ?? '')
    .split(',')
    .map((v) => Number.parseInt(v, 10))
    .filter((n) => Number.isInteger(n));
  const active = Number.parseInt(
    cookieStore.get('activeSessionId')?.value ?? '',
    10,
  );
  if (Number.isInteger(active) && !ids.includes(active)) ids.push(active);
  return ids;
}

/**
 * Remember a session for this browser so it shows up on the dashboard.
 */
export async function addKnownSessionId(sessionId: number): Promise<void> {
  const cookieStore = await cookies();
  const ids = (await getKnownSessionIds()).filter((id) => id !== sessionId);
  ids.unshift(sessionId);
  cookieStore.set(KNOWN_SESSIONS_COOKIE, ids.slice(0, MAX_KNOWN_SESSIONS).join(','), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 365,
  });
}

/**
 * Clear the active session ID from cookies
 */
export async function clearActiveSessionId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('activeSessionId');
}
