'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

// Helper to format numbers: show decimals only if needed
const formatNumber = (num: number): string => {
  return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
};

interface Player {
  id: number;
  name: string;
  totalPushups: number;
}

const COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#FFE66D', // Yellow
  '#95E1D3', // Mint
  '#F38181', // Pink
  '#AA96DA', // Purple
  '#FCBAD3', // Light Pink
  '#A8D8EA', // Light Blue
];

interface RaceTrackProps {
  players: Player[];
  activityUnit?: string;
  milestone?: number;
}

export default function RaceTrack({
  players,
  activityUnit = 'pushups',
  milestone = 0,
}: RaceTrackProps) {
  const highestScore = Math.max(0, ...players.map((p) => p.totalPushups));
  const hasMilestone = Number.isFinite(milestone) && milestone > 0;
  const scaleMaximum =
    hasMilestone
      ? Math.max(highestScore, milestone)
      : Math.max(highestScore, 100);
  const scaleSource = hasMilestone
    ? highestScore > milestone
      ? 'current leader'
      : 'milestone'
    : highestScore >= 100
      ? 'current leader'
      : 'minimum scale';
  const sortedPlayers = [...players].sort(
    (a, b) => b.totalPushups - a.totalPushups,
  );

  return (
    <div className="w-full space-y-6 p-6">
      {players.length > 0 && (
        <div className="flex items-center gap-2 mb-8">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <div>
            <h2 className="text-3xl font-bold text-white">Leaderboard</h2>
            <p className="text-sm text-gray-400">
              Scale: {formatNumber(scaleMaximum)} {activityUnit} · {scaleSource}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {sortedPlayers.map((player, index) => {
          const percentage = Math.min(
            (player.totalPushups / scaleMaximum) * 100,
            100,
          );
          const color = COLORS[index % COLORS.length];

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full font-bold text-white bg-gray-700">
                #{index + 1}
              </div>

              <div className="flex-grow">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-white">
                    {player.name}
                  </h3>
                  <div className="flex flex-col items-end">
                    <motion.span
                      key={player.totalPushups}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-xl font-bold text-white"
                    >
                      {formatNumber(player.totalPushups)} {activityUnit} 💪
                    </motion.span>
                    {hasMilestone && (
                      <span className="text-xs text-gray-400">
                        {player.totalPushups < milestone
                          ? `${formatNumber(milestone - player.totalPushups)} away from milestone`
                          : player.totalPushups === milestone
                            ? 'Milestone reached'
                            : `${formatNumber(player.totalPushups - milestone)} beyond milestone`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-8 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{
                      duration: 0.6,
                      ease: 'easeOut',
                    }}
                    className="h-full flex items-center justify-end pr-2 relative"
                    style={{ backgroundColor: color }}
                  >
                    {percentage > 15 && (
                      <span className="text-sm font-bold text-white">
                        {Math.round(percentage)}%
                      </span>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
