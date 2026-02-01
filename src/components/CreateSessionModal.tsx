'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock } from 'lucide-react';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSession: (
    name: string,
    password: string,
    sessionType: 'pushups' | 'plank',
  ) => Promise<void>;
}

export default function CreateSessionModal({
  isOpen,
  onClose,
  onCreateSession,
}: CreateSessionModalProps) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sessionType, setSessionType] = useState<'pushups' | 'plank'>(
    'pushups',
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Session name is required');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateSession(name.trim(), password, sessionType);
      setName('');
      setPassword('');
      setConfirmPassword('');
      setSessionType('pushups');
      onClose();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="rounded-2xl shadow-2xl max-w-md w-full p-8 relative border"
          style={{
            backgroundColor: 'rgb(31, 41, 55)',
            borderColor: 'rgb(55, 65, 81)',
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-300 transition-colors"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Lock className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Create New Session
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="sessionName"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Session Name
              </label>
              <input
                id="sessionName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                style={{
                  backgroundColor: 'rgb(55, 65, 81)',
                  borderColor: 'rgb(75, 85, 99)',
                  color: 'white',
                }}
                placeholder="e.g., Summer 2026 Challenge"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="sessionType"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Session Type
              </label>
              <select
                id="sessionType"
                value={sessionType}
                onChange={(e) =>
                  setSessionType(e.target.value as 'pushups' | 'plank')
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                style={{
                  backgroundColor: 'rgb(55, 65, 81)',
                  borderColor: 'rgb(75, 85, 99)',
                  color: 'white',
                }}
                disabled={isSubmitting}
              >
                <option value="pushups">Pushups Session</option>
                <option value="plank">Plank Position Session</option>
              </select>
              <p className="mt-1 text-xs text-gray-400">
                {sessionType === 'pushups'
                  ? 'Track pushup counts with whole numbers'
                  : 'Track plank time in quarters (0.25, 0.5, 0.75, 1, etc.)'}
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                style={{
                  backgroundColor: 'rgb(55, 65, 81)',
                  borderColor: 'rgb(75, 85, 99)',
                  color: 'white',
                }}
                placeholder="Minimum 4 characters"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                style={{
                  backgroundColor: 'rgb(55, 65, 81)',
                  borderColor: 'rgb(75, 85, 99)',
                  color: 'white',
                }}
                placeholder="Re-enter password"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="bg-red-900/50 text-red-200 px-4 py-2 rounded-lg text-sm border border-red-800">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border rounded-lg transition-colors text-gray-300 hover:bg-gray-700"
                style={{
                  borderColor: 'rgb(75, 85, 99)',
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
