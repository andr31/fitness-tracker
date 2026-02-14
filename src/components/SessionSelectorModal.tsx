'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, History, Archive, Trash2, Share2, Check } from 'lucide-react';

interface Session {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdAtLocalDate?: string;
  lastActivityDate?: string | null;
  playerCount?: number;
}

interface SessionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNew: () => void;
  onSessionChange: () => void;
}

export default function SessionSelectorModal({
  isOpen,
  onClose,
  onCreateNew,
  onSessionChange,
}: SessionSelectorModalProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [archiving, setArchiving] = useState<number | null>(null);
  const [archivingSession, setArchivingSession] = useState<number | null>(null);
  const [deletingSession, setDeletingSession] = useState<number | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [archiveAdminPassword, setArchiveAdminPassword] = useState('');
  const [copiedSessionId, setCopiedSessionId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
      fetchActiveSession();
    }
  }, [isOpen]);

  const fetchActiveSession = async () => {
    try {
      const response = await fetch('/api/sessions/active');
      if (response.ok) {
        const session = await response.json();
        setActiveSessionId(session.id);
      } else {
        setActiveSessionId(null);
      }
    } catch (err) {
      setActiveSessionId(null);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sessions');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data);
      setError('');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load sessions';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateSession = async () => {
    if (!selectedSession || !password) {
      setError('Please select a session and enter the password');
      return;
    }

    try {
      setIsActivating(true);
      setError(''); // Clear any previous errors
      const response = await fetch(
        `/api/sessions/${selectedSession}/activate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to activate session');
      }

      setPassword('');
      setSelectedSession(null);
      setError(''); // Clear error on success
      await fetchActiveSession(); // Refresh active session indicator
      onSessionChange();
      onClose();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to activate session';
      setError(errorMessage);
    } finally {
      setIsActivating(false);
    }
  };

  const handleArchiveSession = async (sessionId: number) => {
    setSelectedSession(null); // Clear selection when archiving
    setArchivingSession(sessionId);
  };

  const confirmArchiveSession = async () => {
    if (!archivingSession || !archiveAdminPassword) {
      setError('Admin password is required to archive a session');
      return;
    }

    if (
      !confirm(
        'Archive current session data? This will create a backup before switching.',
      )
    ) {
      return;
    }

    try {
      setArchiving(archivingSession);
      const response = await fetch(
        `/api/sessions/${archivingSession}/archive`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminPassword: archiveAdminPassword }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to archive session');
      }

      alert('Session archived successfully!');
      setArchivingSession(null);
      setArchiveAdminPassword('');
      fetchSessions();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to archive session';
      setError(errorMessage);
    } finally {
      setArchiving(null);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    if (activeSessionId === sessionId) {
      alert(
        'Cannot delete active session. Please switch to another session first.',
      );
      return;
    }

    setSelectedSession(null); // Clear selection when deleting
    setDeletingSession(sessionId);
  };

  const confirmDeleteSession = async () => {
    if (!deletingSession || !adminPassword) {
      setError('Admin password is required to delete a session');
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${deletingSession}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete session');
      }

      alert('Session deleted successfully!');
      setDeletingSession(null);
      setAdminPassword('');
      fetchSessions();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete session';
      setError(errorMessage);
    }
  };

  const handleShareSession = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/share-link`);
      if (response.ok) {
        const data = await response.json();
        await navigator.clipboard.writeText(data.shareUrl);
        setCopiedSessionId(sessionId);
        setTimeout(() => setCopiedSessionId(null), 2000);
      } else {
        setError('Failed to generate share link');
      }
    } catch (err) {
      console.error('Error sharing session:', err);
      setError('Failed to copy share link');
    }
  };

  if (!isOpen) return null;

  const activeSession = sessions.find((s) => s.isActive);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col border"
          style={{
            backgroundColor: 'rgb(31, 41, 55)',
            borderColor: 'rgb(55, 65, 81)',
          }}
        >
          <div
            className="p-6 border-b"
            style={{ borderColor: 'rgb(55, 65, 81)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <History className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Session Manager
                  </h2>
                  {activeSession && (
                    <p className="text-sm text-gray-400">
                      Active:{' '}
                      <span className="font-medium text-blue-400">
                        {activeSession.name}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-400">
                Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No sessions found</p>
                <button
                  onClick={onCreateNew}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Create First Session
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="border rounded-lg p-4 transition-all cursor-pointer"
                    style={{
                      borderColor:
                        selectedSession === session.id
                          ? 'rgb(59, 130, 246)'
                          : activeSessionId === session.id
                            ? 'rgb(34, 197, 94)'
                            : 'rgb(75, 85, 99)',
                      backgroundColor:
                        selectedSession === session.id
                          ? 'rgba(59, 130, 246, 0.1)'
                          : activeSessionId === session.id
                            ? 'rgba(34, 197, 94, 0.1)'
                            : 'rgb(55, 65, 81)',
                    }}
                    onClick={() => {
                      if (activeSessionId !== session.id) {
                        setDeletingSession(null); // Clear deleting state when selecting
                        setSelectedSession(session.id);
                      }
                    }}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-white">
                              {session.name}
                            </h3>
                            {activeSessionId === session.id && (
                              <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full flex-shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Created:{' '}
                            {(() => {
                              const dateStr =
                                session.createdAtLocalDate ||
                                session.createdAt.split('T')[0];
                              const date = new Date(dateStr + 'T00:00:00');
                              return date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              });
                            })()}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            {session.playerCount !== undefined && (
                              <span className="text-xs text-gray-400">
                                👥 {session.playerCount} player
                                {session.playerCount !== 1 ? 's' : ''}
                              </span>
                            )}
                            {session.lastActivityDate ? (
                              <span className="text-xs text-gray-400">
                                Last active:{' '}
                                {(() => {
                                  const lastDate = new Date(
                                    session.lastActivityDate + 'T00:00:00',
                                  );
                                  const now = new Date();
                                  const today = new Date(
                                    now.getFullYear(),
                                    now.getMonth(),
                                    now.getDate(),
                                  );
                                  const diffDays = Math.floor(
                                    (today.getTime() - lastDate.getTime()) /
                                      (1000 * 60 * 60 * 24),
                                  );
                                  if (diffDays === 0) return '🟢 Today';
                                  if (diffDays === 1) return '🟢 Yesterday';
                                  if (diffDays <= 3)
                                    return `🟡 ${diffDays} days ago`;
                                  return `🔴 ${diffDays} days ago`;
                                })()}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">
                                No activity yet
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareSession(session.id);
                          }}
                          className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors border text-blue-300 hover:bg-blue-900/30"
                          style={{
                            backgroundColor: 'rgb(75, 85, 99)',
                            borderColor: 'rgb(59, 130, 246)',
                          }}
                          title="Copy share link"
                        >
                          {copiedSessionId === session.id ? (
                            <>
                              <Check size={14} />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Share2 size={14} />
                              Share
                            </>
                          )}
                        </button>
                        {activeSessionId === session.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchiveSession(session.id);
                            }}
                            disabled={archiving === session.id}
                            className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors disabled:opacity-50 border text-gray-300 hover:bg-gray-600"
                            style={{
                              backgroundColor: 'rgb(75, 85, 99)',
                              borderColor: 'rgb(107, 114, 128)',
                            }}
                          >
                            <Archive size={14} />
                            {archiving === session.id
                              ? 'Archiving...'
                              : 'Archive'}
                          </button>
                        )}
                        {activeSessionId !== session.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors border text-red-300 hover:bg-red-900/30"
                            style={{
                              backgroundColor: 'rgb(75, 85, 99)',
                              borderColor: 'rgb(127, 29, 29)',
                            }}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline password input for selected non-active session */}
                    <AnimatePresence>
                      {selectedSession === session.id &&
                        activeSessionId !== session.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div
                              className="mt-3 pt-3 border-t"
                              style={{ borderColor: 'rgb(75, 85, 99)' }}
                            >
                              <label
                                htmlFor={`sessionPassword-${session.id}`}
                                className="block text-sm font-medium text-gray-300 mb-2"
                              >
                                Enter password to activate{' '}
                                <span className="font-bold text-white">
                                  {session.name}
                                </span>
                              </label>
                              <input
                                id={`sessionPassword-${session.id}`}
                                type="password"
                                value={password}
                                onChange={(e) => {
                                  setPassword(e.target.value);
                                  setError('');
                                }}
                                onKeyDown={(e) =>
                                  e.key === 'Enter' && handleActivateSession()
                                }
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                                style={{
                                  backgroundColor: 'rgb(75, 85, 99)',
                                  borderColor: 'rgb(107, 114, 128)',
                                  color: 'white',
                                }}
                                placeholder="Password"
                                disabled={isActivating}
                                autoFocus
                              />
                              {error && (
                                <div className="mt-2 bg-red-900/50 text-red-200 px-3 py-2 rounded-lg text-sm border border-red-800">
                                  {error}
                                </div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActivateSession();
                                }}
                                disabled={isActivating || !password}
                                className="mt-3 w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
                              >
                                {isActivating
                                  ? 'Activating...'
                                  : 'Activate Session'}
                              </button>
                            </div>
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}

            {archivingSession && (
              <div
                className="mt-6 p-4 rounded-lg border"
                style={{
                  backgroundColor: 'rgb(55, 45, 29)',
                  borderColor: 'rgb(120, 53, 15)',
                }}
              >
                <label
                  htmlFor="archiveAdminPassword"
                  className="block text-sm font-medium text-amber-200 mb-2"
                >
                  Enter admin password to archive session
                </label>
                <input
                  id="archiveAdminPassword"
                  type="password"
                  value={archiveAdminPassword}
                  onChange={(e) => {
                    setArchiveAdminPassword(e.target.value);
                    setError(''); // Clear error when typing
                  }}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && confirmArchiveSession()
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-colors"
                  style={{
                    backgroundColor: 'rgb(70, 55, 35)',
                    borderColor: 'rgb(120, 53, 15)',
                    color: 'white',
                  }}
                  placeholder="Admin password"
                />
                {error && (
                  <div className="mt-2 bg-amber-900/50 text-amber-200 px-3 py-2 rounded-lg text-sm border border-amber-800">
                    {error}
                  </div>
                )}
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() => {
                      setArchivingSession(null);
                      setArchiveAdminPassword('');
                      setError(''); // Clear error when canceling
                    }}
                    className="flex-1 px-4 py-2 border rounded-lg transition-colors text-gray-300"
                    style={{
                      borderColor: 'rgb(120, 53, 15)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmArchiveSession}
                    disabled={!archiveAdminPassword || archiving !== null}
                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all disabled:opacity-50"
                  >
                    {archiving ? 'Archiving...' : 'Archive Session'}
                  </button>
                </div>
              </div>
            )}

            {deletingSession && (
              <div
                className="mt-6 p-4 rounded-lg border"
                style={{
                  backgroundColor: 'rgb(75, 29, 29)',
                  borderColor: 'rgb(127, 29, 29)',
                }}
              >
                <label
                  htmlFor="adminPassword"
                  className="block text-sm font-medium text-red-200 mb-2"
                >
                  Enter admin password to delete session
                </label>
                <input
                  id="adminPassword"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setError(''); // Clear error when typing
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && confirmDeleteSession()}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-colors"
                  style={{
                    backgroundColor: 'rgb(95, 40, 40)',
                    borderColor: 'rgb(127, 29, 29)',
                    color: 'white',
                  }}
                  placeholder="Admin password"
                />
                {error && (
                  <div className="mt-2 bg-red-900/50 text-red-200 px-3 py-2 rounded-lg text-sm border border-red-800">
                    {error}
                  </div>
                )}
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() => {
                      setDeletingSession(null);
                      setAdminPassword('');
                      setError(''); // Clear error when canceling
                    }}
                    className="flex-1 px-4 py-2 border rounded-lg transition-colors text-gray-300"
                    style={{
                      borderColor: 'rgb(127, 29, 29)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteSession}
                    disabled={!adminPassword}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                  >
                    Delete Session
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            className="p-6 border-t"
            style={{
              borderColor: 'rgb(55, 65, 81)',
              backgroundColor: 'rgb(55, 65, 81)',
            }}
          >
            <button
              onClick={onCreateNew}
              className="w-full px-4 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 text-gray-300 hover:bg-gray-600"
              style={{
                borderColor: 'rgb(75, 85, 99)',
              }}
            >
              <Plus size={20} />
              Create New Session
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
