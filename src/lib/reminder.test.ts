import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDailyReminder } from './reminder';
import { isValidPushEndpoint, isValidPushKey, isValidTimeZone } from './pushValidation';
import { getPushConfig } from './pushConfig';

const base = {
  now: new Date('2026-03-08T23:10:00Z'),
  timezone: 'America/New_York',
  endDate: '2026-03-12T00:00',
  milestone: 100,
  total: 75,
  sessionType: 'pushups',
  exerciseName: null,
};

describe('daily reminders', () => {
  it('uses the user’s local time and the existing daily pace', () => {
    assert.deepEqual(getDailyReminder(base), {
      date: '2026-03-08',
      body: 'Keep going! Your pace is 7 push-ups per day to reach your goal.',
    });
    assert.equal(getDailyReminder({ ...base, now: new Date('2026-03-08T22:59:00Z') }), null);
    assert.equal(getDailyReminder({ ...base, now: new Date('2026-03-09T00:00:00Z') }), null);
  });

  it('uses quarter-minute increments for plank sessions and custom exercise names', () => {
    assert.match(
      getDailyReminder({ ...base, milestone: 10, total: 7, sessionType: 'plank' })!.body,
      /0.75 minutes of plank/,
    );
    assert.match(
      getDailyReminder({ ...base, sessionType: 'custom', exerciseName: 'Squats' })!.body,
      /7 Squats per day/,
    );
  });

  it('skips missing or expired deadlines and completed milestones', () => {
    assert.equal(getDailyReminder({ ...base, endDate: null }), null);
    assert.equal(getDailyReminder({ ...base, endDate: '2026-03-08T19:00' }), null);
    assert.equal(getDailyReminder({ ...base, total: 100 }), null);
  });

  it('handles timezones with non-hour offsets', () => {
    const result = getDailyReminder({
      ...base,
      now: new Date('2026-03-08T13:15:00Z'),
      timezone: 'Asia/Kathmandu',
    });
    assert.equal(result?.date, '2026-03-08');
  });

  it('reports an invalid deadline or timezone instead of silently sending', () => {
    assert.throws(() => getDailyReminder({ ...base, endDate: 'invalid' }), /Invalid competition deadline/);
    assert.throws(() => getDailyReminder({ ...base, timezone: 'invalid' }), RangeError);
  });
});

describe('push subscription validation', () => {
  it('accepts known push services and rejects untrusted or spoofed endpoints', () => {
    assert.equal(isValidPushEndpoint('https://fcm.googleapis.com/fcm/send/abc'), true);
    assert.equal(isValidPushEndpoint('https://web.push.apple.com/Q/abc'), true);
    assert.equal(isValidPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/abc'), true);
    assert.equal(isValidPushEndpoint('https://fcm.googleapis.com.evil.test/path'), false);
    assert.equal(isValidPushEndpoint('https://fcm.googleapis.com@evil.test/path'), false);
    assert.equal(isValidPushEndpoint('http://fcm.googleapis.com/path'), false);
    assert.equal(isValidPushEndpoint('https://fcm.googleapis.com:444/path'), false);
  });

  it('validates timezones and encoded key lengths', () => {
    assert.equal(isValidTimeZone('America/New_York'), true);
    assert.equal(isValidTimeZone('not-a-timezone'), false);
    assert.equal(isValidPushKey(Buffer.alloc(16).toString('base64url'), 16), true);
    assert.equal(isValidPushKey('invalid!', 16), false);
  });

  it('requires complete, valid VAPID and scheduler configuration', () => {
    const names = ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT', 'CRON_SECRET'] as const;
    const original = names.map((name) => process.env[name]);
    try {
      process.env.VAPID_PUBLIC_KEY = Buffer.alloc(65, 1).toString('base64url');
      process.env.VAPID_PRIVATE_KEY = Buffer.alloc(32, 1).toString('base64url');
      process.env.VAPID_SUBJECT = 'mailto:reminders@example.com';
      process.env.CRON_SECRET = 'a'.repeat(16);
      assert.ok(getPushConfig());
      process.env.CRON_SECRET = 'short';
      assert.equal(getPushConfig(), null);
      process.env.CRON_SECRET = 'a'.repeat(16);
      process.env.VAPID_SUBJECT = 'http://example.com';
      assert.equal(getPushConfig(), null);
    } finally {
      names.forEach((name, index) => {
        if (original[index] === undefined) delete process.env[name];
        else process.env[name] = original[index];
      });
    }
  });
});
