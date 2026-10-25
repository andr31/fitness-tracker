'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, History, Share2, Check } from 'lucide-react';

interface Session {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sessionType?: 'pushups' | 'plank' | 'custom';
  customExerciseName?: string | null;
  createdAtLocalDate?: string;
  lastActivityDate?: string | null;
  playerCount?: number;
  authMode?: 'open' | 'account';
  isMember?: boolean;
}

interface SessionSelectorModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onCreateNew: () => void;
  onSessionChange: () => void;
  variant?: 'modal' | 'page';
}

export default function SessionSelectorModal({
  isOpen,
  onClose = () => {},
  onCreateNew,
  onSessionChange,
  variant = 'modal',
}: SessionSelectorModalProps) {
  const isPage = variant === 'page';
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [isActivating, setIsActivating] = useState(false);
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
      const response = await fetch(
        isPage ? '/api/sessions?scope=mine' : '/api/sessions',
      );
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

  const handleActivateSession = async (memberSessionId?: number) => {
    const targetId = memberSessionId ?? selectedSession;
    if (!targetId || (!memberSessionId && !password)) {
      setError('Please select a session and enter the password');
      return;
    }

    try {
      setIsActivating(true);
      setError(''); // Clear any previous errors
      const response = await fetch(
        `/api/sessions/${targetId}/activate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: memberSessionId ? undefined : password }),
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

  const panel = (
        <motion.div
          initial={{ opacity: 0, scale: isPage ? 1 : 0.9, y: isPage ? 20 : 0 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col border ${
            isPage ? 'max-w-5xl' : 'max-w-2xl max-h-[80vh]'
          }`}
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
                    {isPage ? 'Your Sessions' : 'Session Manager'}
                  </h2>
                  {isPage && !activeSession && (
                    <p className="text-sm text-gray-400">
                      Pick a session to jump in, or create a new one
                    </p>
                  )}
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
              {isPage ? (
                <button
                  onClick={onCreateNew}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-2"
                >
                  <Plus size={18} />
                  New Session
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <X size={24} />
                </button>
              )}
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
              <div
                className={
                  isPage ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-3'
                }
              >
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
                      if (session.isMember && activeSessionId !== session.id) {
                        handleActivateSession(session.id);
                      } else if (activeSessionId !== session.id) {
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
                            {session.authMode === 'account' && (
                              <span
                                className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-600 text-xs rounded-full flex-shrink-0"
                                title="You need to sign in to take part in this session"
                              >
                                🔒 Auth required
                              </span>
                            )}
                            {session.isMember && (
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-600 text-xs rounded-full flex-shrink-0">
                                Member · no password needed
                              </span>
                            )}
                            {activeSessionId === session.id && (
                              <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full flex-shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-300 mt-1">
                            {session.sessionType === 'custom'
                              ? session.customExerciseName
                              : session.sessionType === 'plank'
                                ? 'Plank'
                                : 'Pushups'}
                          </p>
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
                                  const raw = session.lastActivityDate!;
                                  const dateStr = raw.includes('T')
                                    ? raw.split('T')[0]
                                    : raw;
                                  const lastDate = new Date(
                                    dateStr + 'T00:00:00',
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
                            className="overflow-hidden -mx-1 px-1 pb-1"
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

          </div>

          {!isPage && (
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
          )}
        </motion.div>
  );

  if (isPage) {
    return <div className="flex justify-center">{panel}</div>;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        {panel}
      </div>
    </AnimatePresence>
  );
}
