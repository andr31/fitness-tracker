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
}

export default function AddPlayerModal({
  isOpen,
  onClose,
  onAdd,
  theme = 'cartoon',
}: AddPlayerModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
              backgroundColor:
                theme === 'christmas' ? 'rgb(100, 35, 35)' : 'rgb(31, 41, 55)',
              borderColor:
                theme === 'christmas' ? 'rgb(220, 38, 38)' : 'rgb(55, 65, 81)',
            }}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Add Player</h2>
              <motion.button
                whileHover={{ rotate: 90 }}
                onClick={onClose}
                className="transition-colors flex-shrink-0 ml-2"
                style={{
                  color:
                    theme === 'christmas'
                      ? 'rgb(186, 230, 253)'
                      : 'rgb(156, 163, 175)',
                }}
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    backgroundColor:
                      theme === 'christmas'
                        ? 'rgb(60, 20, 20)'
                        : 'rgb(55, 65, 81)',
                    borderColor:
                      theme === 'christmas'
                        ? 'rgb(220, 38, 38)'
                        : 'rgb(75, 85, 99)',
                    color: 'white',
                  }}
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm"
                  style={{
                    color:
                      theme === 'christmas'
                        ? 'rgb(186, 230, 253)'
                        : 'rgb(248, 113, 113)',
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
                  backgroundColor:
                    theme === 'christmas'
                      ? 'rgb(34, 197, 94)'
                      : 'rgb(59, 130, 246)',
                }}
              >
                <Plus className="w-5 h-5" />
                Add Player
              </motion.button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
