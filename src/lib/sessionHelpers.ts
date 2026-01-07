import { cookies } from 'next/headers';

/**
 * Get the active session ID from cookies
 * @returns The active session ID or null if not found
 */
export async function getActiveSessionId(): Promise<number | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('activeSessionId')?.value;
  return sessionId ? parseInt(sessionId) : null;
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

/**
 * Clear the active session ID from cookies
 */
export async function clearActiveSessionId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('activeSessionId');
}
