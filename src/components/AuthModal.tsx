'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, LogIn } from 'lucide-react';

export interface CurrentUser {
  id: number;
  email: string;
  displayName: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: CurrentUser) => void;
  title?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthenticated,
  title = 'Sign in',
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { email, password }
          : { email, password, displayName };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      onAuthenticated(data);
      setEmail('');
      setPassword('');
      setDisplayName('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="rounded-2xl shadow-2xl max-w-sm w-full p-8 relative border"
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
              {mode === 'login' ? (
                <LogIn className="text-white" size={24} />
              ) : (
                <User className="text-white" size={24} />
              )}
            </div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>

          <div className="flex mb-4 rounded-lg overflow-hidden border" style={{ borderColor: 'rgb(55, 65, 81)' }}>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="flex-1 py-2 text-sm font-semibold transition-colors"
              style={{
                backgroundColor: mode === 'login' ? 'rgb(59, 130, 246)' : 'rgb(55, 65, 81)',
                color: 'white',
              }}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className="flex-1 py-2 text-sm font-semibold transition-colors"
              style={{
                backgroundColor: mode === 'register' ? 'rgb(59, 130, 246)' : 'rgb(55, 65, 81)',
                color: 'white',
              }}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  style={{
                    backgroundColor: 'rgb(55, 65, 81)',
                    borderColor: 'rgb(75, 85, 99)',
                    color: 'white',
                  }}
                  placeholder="How others will see you"
                  disabled={isSubmitting}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                style={{
                  backgroundColor: 'rgb(55, 65, 81)',
                  borderColor: 'rgb(75, 85, 99)',
                  color: 'white',
                }}
                placeholder="you@example.com"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                style={{
                  backgroundColor: 'rgb(55, 65, 81)',
                  borderColor: 'rgb(75, 85, 99)',
                  color: 'white',
                }}
                placeholder={mode === 'register' ? 'Minimum 6 characters' : 'Your password'}
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="bg-red-900/50 text-red-200 px-4 py-2 rounded-lg text-sm border border-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Log in'
                  : 'Create account'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
