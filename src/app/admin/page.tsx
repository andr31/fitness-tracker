'use client';

import { useState } from 'react';
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react';

interface AdminSession {
  id: number;
  name: string;
  archivedAt: string | null;
  createdAt: string;
  playerCount?: number;
  lastActivityDate?: string | null;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadSessions = async () => {
    const response = await fetch('/api/admin/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: password }),
    });
    if (!response.ok) throw new Error('Failed to load sessions');
    setSessions(await response.json());
  };

  const handleUnlock = async () => {
    setError('');
    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword: password }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid admin password');
      }
      await loadSessions();
      setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock');
    }
  };

  const runAction = async (
    session: AdminSession,
    action: 'archive' | 'restore' | 'delete',
  ) => {
    const prompt =
      action === 'delete'
        ? `Permanently delete "${session.name}" and all its data?`
        : action === 'archive'
          ? `Archive "${session.name}"? It will be hidden from users but can be restored.`
          : `Restore "${session.name}"? It will be visible to users again.`;
    if (!confirm(prompt)) return;

    setBusyId(session.id);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/sessions/${session.id}/${action}`, {
        method: action === 'delete' ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword: password }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} session`);
      }
      setMessage(`Session ${action}d successfully`.replace('deleted', 'permanently deleted'));
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setBusyId(null);
    }
  };

  const activeSessions = sessions.filter((s) => !s.archivedAt);
  const archivedSessions = sessions.filter((s) => s.archivedAt);

  const renderRow = (s: AdminSession) => (
    <div
      key={s.id}
      className="flex items-center justify-between gap-3 p-4 rounded-lg bg-gray-800 border border-gray-700"
    >
      <div>
        <div className="font-medium">{s.name}</div>
        <div className="text-xs text-gray-400">
          {s.playerCount ?? 0} players · last activity{' '}
          {s.lastActivityDate ?? 'none'}
          {s.archivedAt &&
            ` · archived ${new Date(s.archivedAt + 'Z').toLocaleString()}`}
        </div>
      </div>
      <div className="flex gap-2">
        {s.archivedAt ? (
          <button
            onClick={() => runAction(s, 'restore')}
            disabled={busyId !== null}
            className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 border border-green-700 text-green-300 hover:bg-green-900/30 disabled:opacity-50"
          >
            <ArchiveRestore size={14} /> Restore
          </button>
        ) : (
          <button
            onClick={() => runAction(s, 'archive')}
            disabled={busyId !== null}
            className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 border border-gray-500 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
          >
            <Archive size={14} /> Archive
          </button>
        )}
        <button
          onClick={() => runAction(s, 'delete')}
          disabled={busyId !== null}
          className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 border border-red-800 text-red-300 hover:bg-red-900/30 disabled:opacity-50"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin</h1>

        {!unlocked ? (
          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              placeholder="Admin password"
              className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleUnlock}
              disabled={!password}
              className="w-full px-4 py-2 bg-blue-600 rounded-lg disabled:opacity-50"
            >
              Unlock
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {message && <div className="text-green-400 text-sm">{message}</div>}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">
                Active sessions ({activeSessions.length})
              </h2>
              {activeSessions.length === 0 && (
                <p className="text-sm text-gray-400">No active sessions.</p>
              )}
              {activeSessions.map((s) => renderRow(s))}
            </section>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">
                Archived sessions ({archivedSessions.length})
              </h2>
              {archivedSessions.length === 0 && (
                <p className="text-sm text-gray-400">No archived sessions.</p>
              )}
              {archivedSessions.map((s) => renderRow(s))}
            </section>
          </div>
        )}

        {error && (
          <div className="mt-3 bg-red-900/50 text-red-200 px-3 py-2 rounded-lg text-sm border border-red-800">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
