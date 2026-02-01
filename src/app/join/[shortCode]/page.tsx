'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Lock } from 'lucide-react';

export default function JoinSession() {
  const router = useRouter();
  const params = useParams();
  const shortCode = params.shortCode as string;

  const [loading, setLoading] = useState(true);
  const [sessionName, setSessionName] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkSessionAndPassword();
  }, [shortCode]);

  const checkSessionAndPassword = async () => {
    try {
      // First, get session info by short code
      const response = await fetch(`/api/sessions/by-code/${shortCode}`);

      if (!response.ok) {
        setError('Session not found or invalid link');
        setLoading(false);
        return;
      }

      const session = await response.json();
      setSessionName(session.name);

      // Check if password is already saved in cookies
      const savedPassword = getCookie(`session_pwd_${session.id}`);

      if (savedPassword) {
        // Try to activate with saved password
        await activateSession(session.id, savedPassword);
      } else {
        // Need to ask for password
        setNeedsPassword(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error checking session:', err);
      setError('Failed to load session');
      setLoading(false);
    }
  };

  const activateSession = async (sessionId: number, pwd: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      });

      if (response.ok) {
        // Save password in cookie
        setCookie(`session_pwd_${sessionId}`, pwd, 30);
        // Redirect to home page
        router.push('/');
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid password');
        setNeedsPassword(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error activating session:', err);
      setError('Failed to join session');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/sessions/by-code/${shortCode}`);
      if (response.ok) {
        const session = await response.json();
        await activateSession(session.id, password);
      }
    } catch (err) {
      setError('Failed to join session');
      setLoading(false);
    }
  };

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const setCookie = (name: string, value: string, days: number) => {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
  };

  if (loading && !needsPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error && !needsPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-red-500"
        >
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-white mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all"
          >
            Go to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-yellow-500 shadow-2xl"
      >
        <div className="text-center mb-6">
          <Lock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
            Join Session
          </h1>
          <p className="text-gray-300 text-lg font-semibold">{sessionName}</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white font-semibold mb-2">
              Session Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-yellow-500 transition-colors"
              placeholder="Enter password"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Session'
            )}
          </button>
        </form>

        <button
          onClick={() => router.push('/')}
          className="w-full mt-4 text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
}
