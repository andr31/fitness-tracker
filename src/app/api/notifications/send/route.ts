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
      SELECT n.id, n.user_id, n.session_id, n.timezone, n.reminder_times
      FROM push_subscriptions n
      JOIN sessions s ON s.id = n.session_id AND s.archivedAt IS NULL AND s.authMode = 'account'
      JOIN players p ON p.sessionId = s.id AND p.userId = n.user_id
    `;
    let failed = false;
    let sent = 0;
    const candidates: {
      subscription_id: number;
      user_id: number;
      session_id: number;
      timezone: string;
      reminder_date: string;
      reminder_time: string;
      scheduled_at: string;
    }[] = [];
    for (const row of subscriptions.rows) {
      try {
        for (const slot of getDueReminderTimes(now, row.timezone, row.reminder_times)) {
          candidates.push({
            subscription_id: row.id,
            user_id: row.user_id,
            session_id: row.session_id,
            timezone: row.timezone,
            reminder_date: slot.date,
            reminder_time: slot.time,
            scheduled_at: slot.scheduledAt.toISOString(),
          });
        }
      } catch (error) {
        console.error('Failed to process a reminder schedule:', error);
        failed = true;
      }
    }

    const due = await sql`
      WITH candidates AS MATERIALIZED (
        SELECT n.id, n.user_id, n.session_id, n.endpoint, n.p256dh, n.auth, n.timezone,
               p.id AS player_id, s.sessionType, s.customExerciseName,
               d.reminder_date, d.reminder_time, d.scheduled_at,
               COALESCE((SELECT value FROM settings WHERE sessionId = s.id AND key = 'milestone' LIMIT 1), '1000') AS milestone,
               (SELECT endDate FROM competition_settings WHERE sessionId = s.id ORDER BY id DESC LIMIT 1) AS end_date
        FROM jsonb_to_recordset(${JSON.stringify(candidates)}::jsonb) AS d(
          subscription_id integer, user_id integer, session_id integer, timezone text,
          reminder_date text, reminder_time text, scheduled_at text
        )
        JOIN push_subscriptions n ON n.id = d.subscription_id AND n.user_id = d.user_id
          AND n.session_id = d.session_id AND n.timezone = d.timezone
          AND n.reminder_times @> jsonb_build_array(d.reminder_time)
        JOIN sessions s ON s.id = n.session_id AND s.archivedAt IS NULL AND s.authMode = 'account'
        JOIN players p ON p.sessionId = s.id AND p.userId = n.user_id
        WHERE NOT EXISTS (
          SELECT 1 FROM push_reminder_attempts a
          WHERE a.subscription_id = n.id AND a.user_id = n.user_id
            AND a.reminder_date = d.reminder_date::date AND a.reminder_time = d.reminder_time
        )
      ),
      player_dates AS (
        SELECT DISTINCT player_id, session_id, reminder_date FROM candidates
      ),
      daily_totals AS (
        SELECT d.player_id, d.session_id, d.reminder_date, COALESCE(SUM(h.amount), 0) AS today_total
        FROM player_dates d
        LEFT JOIN pushupHistory h ON h.playerId = d.player_id AND h.sessionId = d.session_id
          AND h.localDate = d.reminder_date::date
        GROUP BY d.player_id, d.session_id, d.reminder_date
      )
      SELECT c.*, p.totalpushups, t.today_total
      FROM candidates c
      JOIN players p ON p.id = c.player_id
      JOIN daily_totals t ON t.player_id = c.player_id AND t.session_id = c.session_id
        AND t.reminder_date = c.reminder_date
      ORDER BY c.scheduled_at, c.id
    `;

    for (const row of due.rows) {
      try {
        if (!isValidPushEndpoint(row.endpoint)) throw new Error('Invalid stored push endpoint');
        const total = Number(row.totalpushups);
        const todayTotal = Number(row.today_total);
        const milestone = Number(row.milestone);
        if (!Number.isFinite(total) || !Number.isFinite(todayTotal) || !Number.isFinite(milestone) || milestone <= 0) {
          throw new Error('Invalid player progress or milestone');
        }
        const reminder = getDailyReminder({
          now: new Date(row.scheduled_at),
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
          SELECT id, user_id, ${row.reminder_date}::date, ${row.reminder_time}, ${attemptId}
          FROM push_subscriptions
          WHERE id = ${row.id} AND session_id = ${row.session_id} AND user_id = ${row.user_id}
            AND timezone = ${row.timezone} AND reminder_times @> ${JSON.stringify([row.reminder_time])}::jsonb
          ON CONFLICT DO NOTHING
          RETURNING subscription_id
        `;
        if (!claimed.rows.length) continue;

        try {
          await webPush.sendNotification(
            { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
            JSON.stringify({ title: 'Exercise reminder', body: reminder.body, tag: `daily-exercise-reminder-${row.reminder_date}-${row.reminder_time}` }),
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
          } else {
            await sql`
              DELETE FROM push_reminder_attempts
              WHERE subscription_id = ${row.id} AND attempt_id = ${attemptId}
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
