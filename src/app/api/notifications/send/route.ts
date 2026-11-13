import { randomUUID, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import webPush from 'web-push';
import { sql } from '@/lib/db';
import { getDailyReminder, getDueReminderTimes } from '@/lib/reminder';
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
    const now = new Date();
    await sql`DELETE FROM push_reminder_attempts WHERE reminder_date < CURRENT_DATE - 3`;
    const subscriptions = await sql`
      SELECT n.id, n.user_id, n.session_id, n.endpoint, n.p256dh, n.auth, n.timezone, n.reminder_times,
             p.id AS player_id, p.totalpushups, s.sessionType, s.customExerciseName,
             COALESCE((SELECT value FROM settings WHERE sessionId = s.id AND key = 'milestone' LIMIT 1), '1000') AS milestone,
             (SELECT endDate FROM competition_settings WHERE sessionId = s.id ORDER BY id DESC LIMIT 1) AS end_date
      FROM push_subscriptions n
      JOIN sessions s ON s.id = n.session_id AND s.archivedAt IS NULL AND s.authMode = 'account'
      JOIN players p ON p.sessionId = s.id AND p.userId = n.user_id
    `;
    let failed = false;
    let sent = 0;
    for (const row of subscriptions.rows) {
      try {
        if (!isValidPushEndpoint(row.endpoint)) throw new Error('Invalid stored push endpoint');
        const total = Number(row.totalpushups);
        const milestone = Number(row.milestone);
        if (!Number.isFinite(total) || !Number.isFinite(milestone) || milestone <= 0) {
          throw new Error('Invalid player progress or milestone');
        }
        const due = getDueReminderTimes(now, row.timezone, row.reminder_times);
        for (const slot of due) {
          const progress = await sql`
            SELECT COALESCE(SUM(amount), 0) AS today_total FROM pushupHistory
            WHERE playerId = ${row.player_id} AND sessionId = ${row.session_id}
              AND localDate = ${slot.date}::date
          `;
          const todayTotal = Number(progress.rows[0].today_total);
          if (!Number.isFinite(todayTotal)) throw new Error('Invalid daily progress');
          const reminder = getDailyReminder({
            now: slot.scheduledAt,
            deliveryNow: now,
            timezone: row.timezone,
            endDate: row.end_date,
            milestone,
            total,
            todayTotal,
            sessionType: row.sessiontype,
            exerciseName: row.customexercisename,
          });
          if (!reminder) continue;

          const attemptId = randomUUID();
          const claimed = await sql`
            INSERT INTO push_reminder_attempts (subscription_id, user_id, reminder_date, reminder_time, attempt_id)
            SELECT id, user_id, ${slot.date}::date, ${slot.time}, ${attemptId}
            FROM push_subscriptions
            WHERE id = ${row.id} AND session_id = ${row.session_id} AND user_id = ${row.user_id}
              AND timezone = ${row.timezone} AND reminder_times @> ${JSON.stringify([slot.time])}::jsonb
            ON CONFLICT DO NOTHING
            RETURNING subscription_id
          `;
          if (!claimed.rows.length) continue;

          try {
            await webPush.sendNotification(
              { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
              JSON.stringify({ title: 'Rep Rally', body: reminder.body, tag: `daily-exercise-reminder-${slot.date}-${slot.time}` }),
              { vapidDetails: config, TTL: 3600, timeout: 10_000 },
            );
            sent++;
          } catch (error) {
            const status = error instanceof webPush.WebPushError ? error.statusCode : undefined;
            if (status === 404 || status === 410) {
              await sql`
                DELETE FROM push_subscriptions WHERE id = ${row.id}
                  AND user_id = ${row.user_id} AND endpoint = ${row.endpoint}
                  AND EXISTS (SELECT 1 FROM push_reminder_attempts WHERE subscription_id = ${row.id} AND attempt_id = ${attemptId})
              `;
              break;
            } else {
              await sql`
                DELETE FROM push_reminder_attempts
                WHERE subscription_id = ${row.id} AND attempt_id = ${attemptId}
              `;
              console.error('Push delivery failed:', status ?? 'unknown error');
              failed = true;
            }
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
