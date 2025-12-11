'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, TrendingUp } from 'lucide-react';
import { Theme } from '@/lib/emojis';

interface DailyHistory {
  date: string;
  total: number;
  entries: number;
}

interface DailyHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: number;
  playerName: string;
  theme?: Theme;
}

export default function DailyHistoryModal({
  isOpen,
  onClose,
  playerId,
  playerName,
  theme = 'cartoon',
}: DailyHistoryModalProps) {
  const [history, setHistory] = useState<DailyHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, playerId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/players/${playerId}/history`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Parse the date string and normalize to just the date part
    const datePart = dateString.split('T')[0];
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.getFullYear() + '-' + 
                         String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(yesterday.getDate()).padStart(2, '0');

    if (datePart === todayStr) {
      return 'Today';
    } else if (datePart === yesterdayStr) {
      return 'Yesterday';
    } else {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const totalPushups = history.reduce((sum, day) => sum + parseInt(day.total.toString()), 0);
  const avgPerDay = history.length > 0 ? Math.round(totalPushups / history.length) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 backdrop-blur-sm z-40"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-hidden"
            style={{
              backgroundColor:
                theme === 'christmas' ? 'rgb(127, 29, 29)' : 'rgb(31, 41, 55)',
              border:
                theme === 'christmas'
                  ? '2px solid rgb(220, 38, 38)'
                  : '2px solid rgb(55, 65, 81)',
            }}
          >
            {/* Header */}
            <div
              className="p-6 border-b"
              style={{
                borderColor:
                  theme === 'christmas' ? 'rgb(220, 38, 38)' : 'rgb(55, 65, 81)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    Daily Progress
                  </h2>
                  <p className="text-gray-300 mt-1">{playerName}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Stats Summary */}
              {history.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor:
                        theme === 'christmas'
                          ? 'rgba(34, 197, 94, 0.2)'
                          : 'rgba(59, 130, 246, 0.2)',
                    }}
                  >
                    <div className="text-sm text-gray-300">Total (Last 30d)</div>
                    <div className="text-2xl font-bold text-white">{totalPushups}</div>
                  </div>
                  <div
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor:
                        theme === 'christmas'
                          ? 'rgba(253, 224, 71, 0.2)'
                          : 'rgba(147, 51, 234, 0.2)',
                    }}
                  >
                    <div className="text-sm text-gray-300">Avg per Day</div>
                    <div className="text-2xl font-bold text-white">{avgPerDay}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No history yet. Start adding pushups!
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((day, index) => (
                    <motion.div
                      key={day.date}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-lg p-4 flex items-center justify-between"
                      style={{
                        backgroundColor:
                          index === 0
                            ? theme === 'christmas'
                              ? 'rgba(34, 197, 94, 0.15)'
                              : 'rgba(59, 130, 246, 0.15)'
                            : theme === 'christmas'
                            ? 'rgba(100, 35, 35, 0.5)'
                            : 'rgba(55, 65, 81, 0.5)',
                        border:
                          index === 0
                            ? theme === 'christmas'
                              ? '1px solid rgb(34, 197, 94)'
                              : '1px solid rgb(59, 130, 246)'
                            : 'none',
                      }}
                    >
                      <div>
                        <div className="font-semibold text-white">
                          {formatDate(day.date)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {day.entries} {day.entries === 1 ? 'entry' : 'entries'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp
                          className="w-5 h-5"
                          style={{
                            color:
                              theme === 'christmas'
                                ? 'rgb(34, 197, 94)'
                                : 'rgb(59, 130, 246)',
                          }}
                        />
                        <div className="text-2xl font-bold text-white">
                          {day.total}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
