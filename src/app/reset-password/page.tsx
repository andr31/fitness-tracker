'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const token = useSearchParams().get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-700 border-gray-600 text-white';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
      <div
        className="rounded-2xl shadow-2xl max-w-sm w-full p-8 border"
        style={{
          backgroundColor: 'rgb(31, 41, 55)',
          borderColor: 'rgb(55, 65, 81)',
        }}
      >
        <h1 className="text-xl font-bold text-white mb-6">Reset password</h1>

        {done ? (
          <div className="space-y-4">
            <p className="text-green-300 text-sm">
              Your password was updated. You can now log in.
            </p>
            <Link
              href="/"
              className="block text-center w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold"
            >
              Go to app
            </Link>
          </div>
        ) : !token ? (
          <p className="text-red-200 text-sm">This reset link is invalid.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Minimum 6 characters"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
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
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg disabled:opacity-50 font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Please wait...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
