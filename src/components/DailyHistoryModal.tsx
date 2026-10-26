'use client';

import { useModalA11y } from '@/lib/useModalA11y';
import { ListRowSkeleton } from '@/components/Skeleton';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, TrendingUp } from 'lucide-react';
import { Theme } from '@/lib/emojis';
import { getCalendarActivityStats } from '@/lib/dailyAverage';

interface DailyHistory {
  date: string;
  total: number;
  additions: number;
  removals: number;
}

interface DailyHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: number;
  playerName: string;
  playerCreatedAt: string;
  theme?: Theme;
  sessionType?: 'pushups' | 'plank' | 'custom';
  exerciseLabel?: string;
}

function getThemeColors(theme: Theme) {
  switch (theme) {
    case 'christmas':
      return {
        modalBg: 'rgb(127, 29, 29)',
        modalBorder: 'rgb(220, 38, 38)',
        statBox1: 'rgba(34, 197, 94, 0.2)',
        statBox2: 'rgba(253, 224, 71, 0.2)',
        highlightItemBg: 'rgba(34, 197, 94, 0.15)',
        normalItemBg: 'rgba(100, 35, 35, 0.5)',
        highlightItemBorder: 'rgb(34, 197, 94)',
        trendIcon: 'rgb(34, 197, 94)',
      };
    case 'halloween':
      return {
        modalBg: 'rgb(30, 12, 48)',
        modalBorder: 'rgb(249, 115, 22)',
        statBox1: 'rgba(234, 88, 12, 0.25)',
        statBox2: 'rgba(168, 85, 247, 0.25)',
        highlightItemBg: 'rgba(234, 88, 12, 0.2)',
        normalItemBg: 'rgba(46, 16, 74, 0.5)',
        highlightItemBorder: 'rgb(249, 115, 22)',
        trendIcon: 'rgb(249, 115, 22)',
      };
    default:
      return {
        modalBg: 'rgb(31, 41, 55)',
        modalBorder: 'rgb(55, 65, 81)',
        statBox1: 'rgba(59, 130, 246, 0.2)',
        statBox2: 'rgba(147, 51, 234, 0.2)',
        highlightItemBg: 'rgba(59, 130, 246, 0.15)',
        normalItemBg: 'rgba(55, 65, 81, 0.5)',
        highlightItemBorder: 'rgb(59, 130, 246)',
        trendIcon: 'rgb(59, 130, 246)',
      };
  }
}

export default function DailyHistoryModal({
  isOpen,
  onClose,
  playerId,
  playerName,
  playerCreatedAt,
  theme = 'cartoon',
  sessionType = 'pushups',
  exerciseLabel = 'Pushups',
}: DailyHistoryModalProps) {
  const colors = getThemeColors(theme);
  const dialogRef = useModalA11y<HTMLDivElement>(isOpen, onClose);
  const activityUnit =
    sessionType === 'plank'
      ? 'minutes'
      : sessionType === 'custom'
        ? exerciseLabel.toLowerCase()
        : 'pushups';
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
    const today = new Date();
    const todayStr =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0');

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr =
      yesterday.getFullYear() +
      '-' +
      String(yesterday.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(yesterday.getDate()).padStart(2, '0');

    if (dateString === todayStr) {
      return 'Today';
    } else if (dateString === yesterdayStr) {
      return 'Yesterday';
    } else {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year:
          date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const { total: totalPushups, average: avgPerDay, days: statsDays } =
    getCalendarActivityStats(history, playerCreatedAt);

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
            className="fixed inset-0 backdrop-blur-sm z-40"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
          />

          {/* Modal */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Daily progress for ${playerName}`}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 outline-none w-full max-w-md rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-hidden"
            style={{
              backgroundColor: colors.modalBg,
              border: `2px solid ${colors.modalBorder}`,
            }}
          >
            {/* Header */}
            <div
              className="p-6 border-b"
              style={{
                borderColor: colors.modalBorder,
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
                  aria-label="Close"
                  className="text-gray-400 hover:text-white transition-colors p-2"
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
                      backgroundColor: colors.statBox1,
                    }}
                  >
                    <div className="text-sm text-gray-300">
                      Total (Last {statsDays}d)
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {formatNumber(totalPushups)}
                    </div>
                    <div className="text-xs text-gray-400">{activityUnit}</div>
                  </div>
                  <div
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor: colors.statBox2,
                    }}
                  >
                    <div
                      className="text-sm text-gray-300"
                      title={`Average across the most recent ${statsDays} calendar days`}
                    >
                      Recent avg · {statsDays}d
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {formatNumber(avgPerDay)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {activityUnit}/day
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {loading ? (
                <div className="py-2" role="status" aria-label="Loading history">
                  <ListRowSkeleton />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <div className="text-4xl mb-2" aria-hidden="true">📅</div>
                  <p className="font-semibold text-gray-200">No history yet</p>
                  <p className="text-sm mt-1">
                    Log some {activityUnit} and your daily progress will show up here.
                  </p>
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
                          index === 0 ? colors.highlightItemBg : colors.normalItemBg,
                        border:
                          index === 0 ? `1px solid ${colors.highlightItemBorder}` : 'none',
                      }}
                    >
                      <div>
                        <div className="font-semibold text-white">
                          {formatDate(day.date)}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                          <span className="text-green-400">
                            +{day.additions}
                          </span>
                          {day.removals > 0 && (
                            <span className="text-red-400">
                              -{day.removals}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp
                          className="w-5 h-5"
                          style={{
                            color: colors.trendIcon,
                          }}
                        />
                        <div className="text-2xl font-bold text-white">
                          {formatNumber(day.total)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {activityUnit}
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
