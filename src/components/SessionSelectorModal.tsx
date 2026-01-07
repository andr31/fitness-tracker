'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, History, Archive } from 'lucide-react';

interface Session {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [archiving, setArchiving] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sessions');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data);
      setError('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions';
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
      const response = await fetch(`/api/sessions/${selectedSession}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to activate session');
      }

      setPassword('');
      setSelectedSession(null);
      onSessionChange();
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate session';
      setError(errorMessage);
    } finally {
      setIsActivating(false);
    }
  };

  const handleArchiveSession = async (sessionId: number) => {
    if (!confirm('Archive current session data? This will create a backup before switching.')) {
      return;
    }

    try {
      setArchiving(sessionId);
      const response = await fetch(`/api/sessions/${sessionId}/archive`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to archive session');
      }

      alert('Session archived successfully!');
      fetchSessions();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive session';
      setError(errorMessage);
    } finally {
      setArchiving(null);
    }
  };

  if (!isOpen) return null;

  const activeSession = sessions.find(s => s.isActive);

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
          <div className="p-6 border-b" style={{ borderColor: 'rgb(55, 65, 81)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <History className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Session Manager</h2>
                  {activeSession && (
                    <p className="text-sm text-gray-400">
                      Active: <span className="font-medium text-blue-400">{activeSession.name}</span>
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
              <div className="text-center py-8 text-gray-400">Loading sessions...</div>
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
                      borderColor: selectedSession === session.id
                        ? 'rgb(59, 130, 246)'
                        : session.isActive
                        ? 'rgb(34, 197, 94)'
                        : 'rgb(75, 85, 99)',
                      backgroundColor: selectedSession === session.id
                        ? 'rgba(59, 130, 246, 0.1)'
                        : session.isActive
                        ? 'rgba(34, 197, 94, 0.1)'
                        : 'rgb(55, 65, 81)',
                    }}
                    onClick={() => !session.isActive && setSelectedSession(session.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{session.name}</h3>
                          {session.isActive && (
                            <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Created: {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {session.isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveSession(session.id);
                          }}
                          disabled={archiving === session.id}
                          className="ml-4 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors disabled:opacity-50 border text-gray-300 hover:bg-gray-600"
                          style={{
                            backgroundColor: 'rgb(75, 85, 99)',
                            borderColor: 'rgb(107, 114, 128)',
                          }}
                        >
                          <Archive size={14} />
                          {archiving === session.id ? 'Archiving...' : 'Archive'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedSession && !sessions.find(s => s.id === selectedSession)?.isActive && (
              <div className="mt-6 p-4 rounded-lg border" style={{
                backgroundColor: 'rgb(55, 65, 81)',
                borderColor: 'rgb(75, 85, 99)',
              }}>
                <label htmlFor="sessionPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Enter session password to activate
                </label>
                <input
                  id="sessionPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleActivateSession()}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  style={{
                    backgroundColor: 'rgb(75, 85, 99)',
                    borderColor: 'rgb(107, 114, 128)',
                    color: 'white',
                  }}
                  placeholder="Password"
                  disabled={isActivating}
                />
                <button
                  onClick={handleActivateSession}
                  disabled={isActivating || !password}
                  className="mt-3 w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {isActivating ? 'Activating...' : 'Activate Session'}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-900/50 text-red-200 px-4 py-3 rounded-lg text-sm border border-red-800">
                {error}
              </div>
            )}
          </div>

          <div className="p-6 border-t" style={{
            borderColor: 'rgb(55, 65, 81)',
            backgroundColor: 'rgb(55, 65, 81)',
          }}>
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
