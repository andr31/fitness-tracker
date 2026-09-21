'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy } from 'lucide-react';
import { Theme } from '@/lib/emojis';

interface DayGoalMet {
  date: string;
  total: number;
  target: number;
}

interface DailyGoalStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: number;
  playerName: string;
  theme?: Theme;
  sessionType?: 'pushups' | 'plank';
}

function getThemeColors(theme: Theme) {
  switch (theme) {
    case 'christmas':
      return {
        modalBg: 'rgb(15, 60, 30)',
        modalBorder: 'rgba(34, 197, 94, 0.3)',
        headerBorder: 'rgba(34, 197, 94, 0.3)',
        summaryBg: 'rgba(34, 197, 94, 0.2)',
        summaryBorder: 'rgba(34, 197, 94, 0.3)',
        dayBg: 'rgba(20, 83, 45, 0.5)',
        dayBorder: 'rgba(34, 197, 94, 0.2)',
      };
    case 'halloween':
      return {
        modalBg: 'rgb(30, 12, 48)',
        modalBorder: 'rgba(249, 115, 22, 0.4)',
        headerBorder: 'rgba(249, 115, 22, 0.3)',
        summaryBg: 'rgba(234, 88, 12, 0.2)',
        summaryBorder: 'rgba(249, 115, 22, 0.3)',
        dayBg: 'rgba(46, 16, 74, 0.5)',
        dayBorder: 'rgba(168, 85, 247, 0.25)',
      };
    default:
      return {
        modalBg: 'rgb(31, 41, 55)',
        modalBorder: 'rgba(59, 130, 246, 0.3)',
        headerBorder: 'rgba(75, 85, 99, 0.3)',
        summaryBg: 'rgba(59, 130, 246, 0.2)',
        summaryBorder: 'rgba(59, 130, 246, 0.3)',
        dayBg: 'rgba(55, 65, 81, 0.5)',
        dayBorder: 'rgba(75, 85, 99, 0.3)',
      };
  }
}

export default function DailyGoalStatsModal({
  isOpen,
  onClose,
  playerId,
  playerName,
  theme = 'cartoon',
  sessionType = 'pushups',
}: DailyGoalStatsModalProps) {
  const colors = getThemeColors(theme);
  const [data, setData] = useState<{
    goalsMet: number;
    dailyGoal: number;
    days: DayGoalMet[];
  }>({ goalsMet: 0, dailyGoal: 100, days: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen, playerId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/players/${playerId}/daily-goal-stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching daily goal stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRelativeDay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Helper to format numbers: show decimals only if needed
  const formatNumber = (num: number | string): string => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return '0';
    return n % 1 === 0 ? n.toString() : n.toFixed(2).replace(/\.?0+$/, '');
  };

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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-lg shadow-2xl"
            style={{
              backgroundColor: colors.modalBg,
              border: `2px solid ${colors.modalBorder}`,
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{
                borderColor: colors.headerBorder,
              }}
            >
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-bold text-white">
                  {playerName}'s Daily Goals
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {loading ? (
                <div className="text-center text-white py-8">
                  <div className="animate-spin text-4xl mb-2">⏳</div>
                  <p className="opacity-70">Loading stats...</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div
                    className="rounded-lg p-6 mb-6"
                    style={{
                      backgroundColor: colors.summaryBg,
                      border: `1px solid ${colors.summaryBorder}`,
                    }}
                  >
                    <div className="text-center">
                      <div className="text-5xl font-bold text-white mb-2">
                        {data.goalsMet}
                      </div>
                      <div className="text-lg text-white opacity-70">
                        {data.goalsMet === 1 ? 'Day' : 'Days'} Goal Met
                      </div>
                      <div className="text-sm text-white opacity-50 mt-1">
                        Target: {data.dailyGoal}{' '}
                        {sessionType === 'plank'
                          ? 'minutes/day'
                          : 'pushups/day'}
                      </div>
                    </div>
                  </div>

                  {/* Days List */}
                  {data.days.length > 0 ? (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-white opacity-70 mb-3">
                        Days Achieved
                      </h3>
                      {data.days.map((day, index) => (
                        <motion.div
                          key={day.date}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="rounded-lg p-4 flex items-center justify-between"
                          style={{
                            backgroundColor: colors.dayBg,
                            border: `1px solid ${colors.dayBorder}`,
                          }}
                        >
                          <div>
                            <div className="text-white font-medium">
                              {formatDate(day.date)}
                            </div>
                            <div className="text-sm text-white opacity-50">
                              {getRelativeDay(day.date)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-400">
                              {formatNumber(day.total)} /{' '}
                              {formatNumber(day.target)}
                            </div>
                            <div className="text-xs text-white opacity-50">
                              {sessionType === 'plank' ? 'minutes' : 'pushups'}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-white opacity-70">
                      <div className="text-4xl mb-2">🎯</div>
                      <p>No daily goals met yet</p>
                      <p className="text-sm mt-2 opacity-50">
                        Keep pushing to reach your goal!
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
