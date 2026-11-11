import { randomUUID, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import webPush from 'web-push';
import { sql } from '@/lib/db';
import { getDailyReminder } from '@/lib/reminder';
import { isValidPushEndpoint } from '@/lib/pushValidation';
import { getPushConfig } from '@/lib/pushConfig';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  const expected = secret ? Buffer.from(`Bearer ${secret}`) : null;
  const actual = authorization ? Buffer.from(authorization) : null;
  if (!expected || !actual || expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = getPushConfig();
  if (!config) {
    console.error('Push notification VAPID settings are missing');
    return NextResponse.json({ error: 'Notifications are not configured' }, { status: 503 });
  }

  try {
    const subscriptions = await sql`
      SELECT n.id, n.user_id, n.session_id, n.endpoint, n.p256dh, n.auth, n.timezone,
             p.totalpushups, s.sessionType, s.customExerciseName,
             COALESCE((SELECT value FROM settings WHERE sessionId = s.id AND key = 'milestone' LIMIT 1), '1000') AS milestone,
             (SELECT endDate FROM competition_settings WHERE sessionId = s.id ORDER BY id DESC LIMIT 1) AS end_date
      FROM push_subscriptions n
      JOIN sessions s ON s.id = n.session_id AND s.archivedAt IS NULL AND s.authMode = 'account'
      JOIN players p ON p.sessionId = s.id AND p.userId = n.user_id
    `;
    let failed = false;
    let sent = 0;
    const now = new Date();

    for (const row of subscriptions.rows) {
      try {
        if (!isValidPushEndpoint(row.endpoint)) throw new Error('Invalid stored push endpoint');
        const total = Number(row.totalpushups);
        const milestone = Number(row.milestone);
        if (!Number.isFinite(total) || !Number.isFinite(milestone) || milestone <= 0) {
          throw new Error('Invalid player progress or milestone');
        }
        const reminder = getDailyReminder({
          now,
          timezone: row.timezone,
          endDate: row.end_date,
          milestone,
          total,
          sessionType: row.sessiontype,
          exerciseName: row.customexercisename,
        });
        if (!reminder) continue;

        const attemptId = randomUUID();
        const claimed = await sql`
          UPDATE push_subscriptions
          SET last_reminder_date = ${reminder.date}::date, last_attempt_id = ${attemptId}
          WHERE id = ${row.id} AND session_id = ${row.session_id} AND user_id = ${row.user_id}
            AND last_reminder_date IS DISTINCT FROM ${reminder.date}::date
          RETURNING id
        `;
        if (!claimed.rows.length) continue;

        try {
          await webPush.sendNotification(
            { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
            JSON.stringify({ title: 'Fitness Battle', body: reminder.body }),
            { vapidDetails: config, TTL: 3600 },
          );
          sent++;
        } catch (error) {
          const status = error instanceof webPush.WebPushError ? error.statusCode : undefined;
          if (status === 404 || status === 410) {
            await sql`DELETE FROM push_subscriptions WHERE id = ${row.id} AND last_attempt_id = ${attemptId}`;
          } else {
            await sql`
              UPDATE push_subscriptions SET last_reminder_date = NULL, last_attempt_id = NULL
              WHERE id = ${row.id} AND last_attempt_id = ${attemptId}
            `;
            console.error('Push delivery failed:', status ?? 'unknown error');
            failed = true;
          }
        }
      } catch (error) {
        console.error('Failed to process a reminder:', error);
        failed = true;
      }
    }

    if (failed) return NextResponse.json({ error: 'Some reminders failed', sent }, { status: 500 });
    return NextResponse.json({ sent });
  } catch (error) {
    console.error('Failed to process reminders:', error);
    return NextResponse.json({ error: 'Failed to process reminders' }, { status: 500 });
  }
}
