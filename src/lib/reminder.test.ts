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
  todayTotal: 0,
  sessionType: 'pushups',
  exerciseName: null,
};

describe('daily reminders', () => {
  it('uses the user’s local time and the existing daily pace', () => {
    assert.deepEqual(getDailyReminder(base), {
      date: '2026-03-08',
      body: 'Time for push-ups! 7/day needed; 75/100 done.',
    });
    assert.equal(getDailyReminder({ ...base, now: new Date('2026-03-08T22:59:00Z') }), null);
    assert.equal(getDailyReminder({ ...base, now: new Date('2026-03-09T00:00:00Z') }), null);
  });

  it('uses quarter-minute increments for plank sessions and custom exercise names', () => {
    assert.match(
      getDailyReminder({ ...base, milestone: 10, total: 7, sessionType: 'plank' })!.body,
      /Time for plank! 0.75 min\/day needed; 7\/10 min done/,
    );
    assert.match(
      getDailyReminder({ ...base, sessionType: 'custom', exerciseName: 'Squats' })!.body,
      /Time for Squats! 7\/day needed; 75\/100 done/,
    );
  });

  it('reminds until today’s net exercise reaches the current needed-per-day pace', () => {
    const partial = getDailyReminder({ ...base, total: 78, todayTotal: 3 });
    assert.match(partial!.body, /6\/day needed; 78\/100 done/);
    assert.equal(getDailyReminder({ ...base, total: 72, todayTotal: 7 }), null);
    assert.equal(getDailyReminder({ ...base, total: 72, todayTotal: 8 }), null);
  });

  it('does not remind when 50 are done and the displayed needed-per-day pace is 50', () => {
    const input = { ...base, milestone: 1000, total: 800, todayTotal: 49 };
    assert.match(getDailyReminder(input)!.body, /50\/day needed; 800\/1000 done/);
    assert.equal(getDailyReminder({ ...input, todayTotal: 50 }), null);
  });

  it('handles fractional exercise and net removals', () => {
    const plank = { ...base, milestone: 10, total: 7, todayTotal: 0.5, sessionType: 'plank' };
    assert.match(getDailyReminder(plank)!.body, /0.75 min\/day needed; 7\/10 min done/);
    assert.equal(getDailyReminder({ ...plank, todayTotal: 0.75 }), null);
    const removal = { ...base, total: 70, todayTotal: -5 };
    assert.match(getDailyReminder(removal)!.body, /8\/day needed; 70\/100 done/);
  });

  it('reminds even when the player may be on track overall', () => {
    assert.ok(getDailyReminder({ ...base, total: 90, todayTotal: 0 }));
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

  it('uses the local date when UTC has already moved to the next day', () => {
    const result = getDailyReminder({
      ...base,
      now: new Date('2026-03-09T02:10:00Z'),
      timezone: 'America/Los_Angeles',
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
    assert.equal(isValidPushEndpoint('https://db5.notify.windows.com/?token=abc'), true);
    assert.equal(isValidPushEndpoint('https://notify.windows.com/'), false);
    assert.equal(isValidPushEndpoint('https://db5.notify.windows.com.evil.test/'), false);
    assert.equal(isValidPushEndpoint('http://db5.notify.windows.com/'), false);
    assert.equal(isValidPushEndpoint('https://user@db5.notify.windows.com/'), false);
    assert.equal(isValidPushEndpoint('https://db5.notify.windows.com:444/'), false);
    assert.equal(isValidPushEndpoint('https://db5.notify.windows.com/#fragment'), false);
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
