'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { useToast } from '@/components/Providers';

function applicationServerKey(value: string): Uint8Array<ArrayBuffer> {
  const padded = (value + '='.repeat((4 - value.length % 4) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

export default function ReminderSettings({ sessionId }: { sessionId: number }) {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const interacted = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const subscription = useRef<PushSubscription | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unsupported' | 'error'>('loading');
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        interacted.current = true;
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        event.target instanceof Node &&
        containerRef.current?.contains(event.target)
      ) {
        interacted.current = true;
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

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
        if (!settings.enabled && !interacted.current) setIsOpen(true);
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
        if (!interacted.current) setIsOpen(true);
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

  if (status === 'loading' || status === 'unsupported') return null;

  return (
    <div ref={containerRef} className="relative flex justify-end">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Daily exercise reminders"
        aria-expanded={isOpen}
        aria-controls={isOpen ? id : undefined}
        onClick={() => {
          interacted.current = true;
          setIsOpen((open) => !open);
        }}
        className="rounded-lg p-2 text-white hover:bg-white/10"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          id={id}
          role="dialog"
          aria-labelledby={`${id}-title`}
          className="absolute right-0 top-full z-20 mt-2 max-h-[calc(100dvh-5rem)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-xl border border-gray-600 bg-gray-800 p-4 text-sm text-white shadow-xl"
        >
          <div className="flex items-start justify-between gap-4">
            <h2 id={`${id}-title`} className="font-semibold">Daily exercise reminders</h2>
            <button
              type="button"
              aria-label="Close reminder settings"
              onClick={() => {
                interacted.current = true;
                setIsOpen(false);
                buttonRef.current?.focus();
              }}
              className="rounded p-1 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 text-gray-300">
            Get a reminder around 7 PM in your local time if you haven&apos;t met your needed-per-day pace. Your session needs an unfinished goal and a deadline.
          </p>
          {status === 'error' && <p className="mt-2 text-red-300">{errorMessage}</p>}
          {status === 'ready' && (
            <button
              type="button"
              onClick={enabled ? disable : enable}
              disabled={busy}
              className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {enabled ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              {enabled ? 'Turn off reminders' : 'Enable reminders'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
