import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

const DEVICE_COOKIE = 'pushDevice';

export function newPushDeviceToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashPushDeviceToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function getPushDeviceHash(): Promise<string | null> {
  const token = (await cookies()).get(DEVICE_COOKIE)?.value;
  return token ? hashPushDeviceToken(token) : null;
}

export async function setPushDeviceToken(token: string): Promise<void> {
  (await cookies()).set(DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
}

export async function clearPushDeviceToken(): Promise<void> {
  (await cookies()).delete(DEVICE_COOKIE);
}

export async function syncPushSession(
  userId: number | null,
  sessionId: number | null,
  timezone?: string,
): Promise<void> {
  const deviceHash = await getPushDeviceHash();
  if (!deviceHash) return;

  await sql`
    UPDATE push_subscriptions
    SET session_id = (
      SELECT s.id FROM sessions s
      JOIN players p ON p.sessionId = s.id
      WHERE s.id = ${sessionId} AND s.archivedAt IS NULL
        AND s.authMode = 'account' AND p.userId = ${userId}
        AND push_subscriptions.user_id = ${userId}
    ), timezone = COALESCE(${timezone ?? null}, timezone),
       updated_at = CURRENT_TIMESTAMP
    WHERE device_hash = ${deviceHash}
  `;
}
