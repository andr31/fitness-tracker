import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getActiveSessionId } from '@/lib/sessionHelpers';
import {
  clearPushDeviceToken,
  getPushDeviceHash,
  hashPushDeviceToken,
  newPushDeviceToken,
  setPushDeviceToken,
  syncPushSession,
} from '@/lib/pushDevice';
import { isValidPushEndpoint, isValidPushKey, isValidTimeZone } from '@/lib/pushValidation';
import { getPushConfig } from '@/lib/pushConfig';
import { DEFAULT_REMINDER_TIMES, isValidReminderTimes } from '@/lib/reminder';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 });

    const deviceHash = await getPushDeviceHash();
    const result = deviceHash
      ? await sql`
          SELECT reminder_times FROM push_subscriptions
          WHERE device_hash = ${deviceHash} AND user_id = ${user.id}
        `
      : null;
    return NextResponse.json({
      enabled: !!result?.rows.length,
      publicKey: getPushConfig()?.publicKey ?? null,
      reminderTimes: result?.rows[0]?.reminder_times ?? DEFAULT_REMINDER_TIMES,
    });
  } catch (error) {
    console.error('Failed to load notification settings:', error);
    return NextResponse.json({ error: 'Failed to load notification settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 });
    if (!getPushConfig()) {
      return NextResponse.json({ error: 'Notifications are not configured' }, { status: 503 });
    }

    const sessionId = await getActiveSessionId();
    if (!sessionId) {
      return NextResponse.json({ error: 'Select a session first' }, { status: 400 });
    }
    const membership = await sql`
      SELECT 1 FROM sessions s JOIN players p ON p.sessionId = s.id
      WHERE s.id = ${sessionId} AND s.archivedAt IS NULL
        AND s.authMode = 'account' AND p.userId = ${user.id}
    `;
    if (!membership.rows.length) {
      return NextResponse.json({ error: 'Join this account session first' }, { status: 403 });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || !('subscription' in body) || !('timezone' in body)) {
      return NextResponse.json({ error: 'Invalid notification settings' }, { status: 400 });
    }
    const { subscription, timezone } = body;
    if (
      typeof timezone !== 'string' || !isValidTimeZone(timezone) ||
      !subscription || typeof subscription !== 'object' ||
      !('endpoint' in subscription) || !('keys' in subscription) ||
      typeof subscription.endpoint !== 'string' ||
      !isValidPushEndpoint(subscription.endpoint) ||
      !subscription.keys || typeof subscription.keys !== 'object' ||
      !('p256dh' in subscription.keys) || !('auth' in subscription.keys) ||
      typeof subscription.keys.p256dh !== 'string' ||
      typeof subscription.keys.auth !== 'string' ||
      !isValidPushKey(subscription.keys.p256dh, 65) ||
      !isValidPushKey(subscription.keys.auth, 16)
    ) {
      return NextResponse.json({ error: 'Invalid push subscription or timezone' }, { status: 400 });
    }

    const existingHash = await getPushDeviceHash();
    const token = existingHash ? null : newPushDeviceToken();
    const deviceHash = existingHash ?? hashPushDeviceToken(token!);
    await sql`
      INSERT INTO push_subscriptions
        (device_hash, user_id, session_id, endpoint, p256dh, auth, timezone)
      VALUES
        (${deviceHash}, ${user.id}, ${sessionId}, ${subscription.endpoint},
         ${subscription.keys.p256dh}, ${subscription.keys.auth}, ${timezone})
      ON CONFLICT (device_hash) DO UPDATE SET
        user_id = EXCLUDED.user_id, session_id = EXCLUDED.session_id,
        endpoint = EXCLUDED.endpoint, p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth, timezone = EXCLUDED.timezone,
        reminder_times = CASE WHEN push_subscriptions.user_id = EXCLUDED.user_id
          THEN push_subscriptions.reminder_times ELSE '["19:00"]'::jsonb END,
        last_reminder_date = NULL, last_attempt_id = NULL,
        updated_at = CURRENT_TIMESTAMP
    `;
    if (token) await setPushDeviceToken(token);
    return NextResponse.json({ enabled: true });
  } catch (error) {
    console.error('Failed to enable notifications:', error);
    return NextResponse.json({ error: 'Failed to enable notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 });
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' ||
      (!('timezone' in body) && !('reminderTimes' in body)) ||
      ('timezone' in body && (typeof body.timezone !== 'string' || !isValidTimeZone(body.timezone))) ||
      ('reminderTimes' in body && !isValidReminderTimes(body.reminderTimes))
    ) {
      return NextResponse.json({ error: 'Invalid reminder settings' }, { status: 400 });
    }
    if ('timezone' in body && typeof body.timezone === 'string') {
      await syncPushSession(user.id, await getActiveSessionId(), body.timezone);
    }
    if ('reminderTimes' in body && isValidReminderTimes(body.reminderTimes)) {
      const deviceHash = await getPushDeviceHash();
      const result = await sql`
        UPDATE push_subscriptions
        SET reminder_times = ${JSON.stringify([...body.reminderTimes].sort())}::jsonb,
            updated_at = CURRENT_TIMESTAMP
        WHERE device_hash = ${deviceHash} AND user_id = ${user.id}
        RETURNING id
      `;
      if (!result.rows.length) {
        return NextResponse.json({ error: 'Enable reminders first' }, { status: 404 });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update the reminder session:', error);
    return NextResponse.json({ error: 'Failed to update the reminder session' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 });
    const deviceHash = await getPushDeviceHash();
    if (deviceHash) {
      await sql`DELETE FROM push_subscriptions WHERE device_hash = ${deviceHash} AND user_id = ${user.id}`;
      await clearPushDeviceToken();
    }
    return NextResponse.json({ enabled: false });
  } catch (error) {
    console.error('Failed to disable notifications:', error);
    return NextResponse.json({ error: 'Failed to disable notifications' }, { status: 500 });
  }
}
