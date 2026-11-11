'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useToast } from '@/components/Providers';

function applicationServerKey(value: string): Uint8Array<ArrayBuffer> {
  const padded = (value + '='.repeat((4 - value.length % 4) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

export default function ReminderSettings({ sessionId }: { sessionId: number }) {
  const toast = useToast();
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const subscription = useRef<PushSubscription | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unsupported' | 'error'>('loading');
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    async function initialize() {
      if (!window.isSecureContext || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        if (active) setStatus('unsupported');
        return;
      }

      try {
        await navigator.serviceWorker.register('/sw.js');
        const worker = await navigator.serviceWorker.ready;
        let existing = await worker.pushManager.getSubscription();
        const response = await fetch('/api/notifications');
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to load reminder settings');
        }
        const settings: { enabled: boolean; publicKey: string | null } = await response.json();
        if (!settings.enabled && existing) {
          if (!await existing.unsubscribe()) {
            throw new Error('Failed to remove the previous device subscription');
          }
          existing = null;
        }
        if (settings.enabled && !existing) {
          const removed = await fetch('/api/notifications', { method: 'DELETE' });
          if (!removed.ok) throw new Error('Failed to remove the inactive reminder subscription');
          settings.enabled = false;
        }
        if (settings.enabled && existing) {
          const sync = await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
          });
          if (!sync.ok) throw new Error('Failed to update reminder settings');
        }
        if (!active) return;
        registration.current = worker;
        subscription.current = existing;
        setPublicKey(settings.publicKey ?? '');
        setEnabled(settings.enabled && !!existing);
        if (!settings.publicKey && !settings.enabled) {
          setErrorMessage('Notifications are not configured');
          setStatus('error');
        } else {
          setStatus('ready');
        }
      } catch (error) {
        console.error('Failed to initialize reminders:', error);
        if (!active) return;
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load reminders');
        setStatus('error');
      }
    }
    void initialize();
    return () => { active = false; };
  }, [sessionId]);

  const enable = async () => {
    if (!registration.current || !publicKey) return;
    setBusy(true);
    let newSubscription: PushSubscription | null = null;
    try {
      const current = subscription.current ?? await registration.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey(publicKey),
      });
      if (!subscription.current) newSubscription = current;
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: current.toJSON(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to enable reminders');
      }
      subscription.current = current;
      setEnabled(true);
      toast.success('Daily reminders enabled on this device');
    } catch (error) {
      if (newSubscription) {
        try {
          if (!await newSubscription.unsubscribe()) {
            console.error('Failed to remove the unused push subscription');
          }
        } catch (unsubscribeError) {
          console.error('Failed to remove the unused push subscription:', unsubscribeError);
        }
      }
      console.error('Failed to enable reminders:', error);
      toast.error(
        Notification.permission === 'denied'
          ? 'Notifications are blocked in your device settings'
          : error instanceof Error ? error.message : 'Failed to enable reminders',
      );
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/notifications', { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to disable reminders');
      setEnabled(false);
      if (subscription.current) {
        const removed = await subscription.current.unsubscribe();
        if (!removed) throw new Error('Reminders are disabled, but the device subscription could not be removed');
        subscription.current = null;
      }
      toast.success('Daily reminders disabled on this device');
    } catch (error) {
      console.error('Failed to disable reminders:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to disable reminders');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-600 bg-gray-800/90 p-4 text-white sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">Daily exercise reminders</p>
        <p className="text-sm text-gray-300">
          Get a reminder around 7 PM in your local time if you haven&apos;t met your needed-per-day pace. Your session needs an unfinished goal and a deadline.
        </p>
        {status === 'unsupported' && (
          <p className="mt-1 text-sm text-yellow-300">
            Push notifications are unavailable here. On iPhone, install the app to your Home Screen and open it there.
          </p>
        )}
        {status === 'error' && <p className="mt-1 text-sm text-red-300">{errorMessage}</p>}
      </div>
      {status === 'ready' && (
        <button
          type="button"
          onClick={enabled ? disable : enable}
          disabled={busy}
          className="flex flex-shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700 disabled:opacity-60"
        >
          {enabled ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {enabled ? 'Turn off reminders' : 'Enable reminders'}
        </button>
      )}
    </div>
  );
}
