'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { Theme } from '@/lib/emojis';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
  theme?: Theme;
  accountMode?: boolean;
  joinDisplayName?: string;
}

function getThemeColors(theme: Theme) {
  switch (theme) {
    case 'christmas':
      return {
        modalBg: 'rgb(100, 35, 35)',
        modalBorder: 'rgb(220, 38, 38)',
        closeIcon: 'rgb(186, 230, 253)',
        inputBg: 'rgb(60, 20, 20)',
        inputBorder: 'rgb(220, 38, 38)',
        errorText: 'rgb(186, 230, 253)',
        submitBg: 'rgb(34, 197, 94)',
      };
    case 'halloween':
      return {
        modalBg: 'rgb(30, 12, 48)',
        modalBorder: 'rgb(249, 115, 22)',
        closeIcon: 'rgb(216, 180, 254)',
        inputBg: 'rgb(46, 16, 74)',
        inputBorder: 'rgb(168, 85, 247)',
        errorText: 'rgb(190, 242, 100)',
        submitBg: 'rgb(234, 88, 12)',
      };
    default:
      return {
        modalBg: 'rgb(31, 41, 55)',
        modalBorder: 'rgb(55, 65, 81)',
        closeIcon: 'rgb(156, 163, 175)',
        inputBg: 'rgb(55, 65, 81)',
        inputBorder: 'rgb(75, 85, 99)',
        errorText: 'rgb(248, 113, 113)',
        submitBg: 'rgb(59, 130, 246)',
      };
  }
}

export default function AddPlayerModal({
  isOpen,
  onClose,
  onAdd,
  theme = 'cartoon',
  accountMode = false,
  joinDisplayName,
}: AddPlayerModalProps) {
  const colors = getThemeColors(theme);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (accountMode) {
      // Account-based sessions: joining uses the logged-in user's display name.
      onAdd(joinDisplayName || '');
      return;
    }

    if (!name.trim()) {
      setError('Player name is required');
      return;
    }

    onAdd(name.trim());
    setName('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-2xl border z-50 w-[calc(100%-2rem)] sm:w-full max-w-sm p-6 sm:p-8"
            style={{
              backgroundColor: colors.modalBg,
              borderColor: colors.modalBorder,
            }}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {accountMode ? 'Join Session' : 'Add Player'}
              </h2>
              <motion.button
                whileHover={{ rotate: 90 }}
                onClick={onClose}
                className="transition-colors flex-shrink-0 ml-2"
                style={{
                  color: colors.closeIcon,
                }}
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {accountMode ? (
                <p className="text-sm text-gray-300">
                  You&apos;ll join as{' '}
                  <span className="font-semibold text-white">
                    {joinDisplayName}
                  </span>
                  . You can only manage your own data in this session.
                </p>
              ) : (
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter player name"
                    className="w-full rounded px-4 py-3 border outline-none transition-colors"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: 'white',
                    }}
                  />
                </div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm"
                  style={{
                    color: colors.errorText,
                  }}
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full text-white font-bold py-3 rounded transition-colors flex items-center justify-center gap-2"
                style={{
                  backgroundColor: colors.submitBg,
                }}
              >
                <Plus className="w-5 h-5" />
                {accountMode ? 'Join Session' : 'Add Player'}
              </motion.button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
