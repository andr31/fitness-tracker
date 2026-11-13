import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { runInNewContext } from 'node:vm';

describe('push service worker', () => {
  it('shows the reminder and opens the app when it is tapped', async () => {
    const handlers: Record<string, (event: unknown) => void> = {};
    let notification: { title: string; options: { body: string; tag: string } } | undefined;
    let opened = '';
    let closed = false;
    let pending = Promise.resolve<unknown>(undefined);

    runInNewContext(readFileSync('public/sw.js', 'utf8'), {
      URL,
      self: {
        location: { origin: 'https://example.com' },
        addEventListener: (type: string, handler: (event: unknown) => void) => {
          handlers[type] = handler;
        },
        registration: {
          showNotification: async (title: string, options: { body: string; tag: string }) => {
            notification = { title, options };
          },
        },
        clients: {
          matchAll: async () => [],
          openWindow: async (url: string) => { opened = url; },
        },
      },
    });

    handlers.push({
      data: { json: () => ({ title: 'Rep Rally', body: 'Your daily pace', tag: 'reminder-19:00' }) },
      waitUntil: (promise: Promise<unknown>) => { pending = promise; },
    });
    await pending;
    assert.equal(notification?.title, 'Rep Rally');
    assert.equal(notification?.options.body, 'Your daily pace');
    assert.equal(notification?.options.tag, 'reminder-19:00');

    handlers.notificationclick({
      notification: { close: () => { closed = true; } },
      waitUntil: (promise: Promise<unknown>) => { pending = promise; },
    });
    await pending;
    assert.equal(closed, true);
    assert.equal(opened, '/');
  });
});
