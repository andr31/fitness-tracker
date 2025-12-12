'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Trash2, Calendar } from 'lucide-react';
import AnimatedIcon from './AnimatedIcon';
import DailyHistoryModal from './DailyHistoryModal';
import { getPlayerEmoji, getPlayerAnimation, Theme } from '@/lib/emojis';

interface Player {
  id: number;
  name: string;
  totalPushups: number;
}

interface PlayerCardProps {
  player: Player;
  onAddPushups: (amount: number) => void;
  onRemovePushups: (amount: number) => void;
  onDelete: () => void;
  theme?: Theme;
  milestone?: number;
}

export default function PlayerCard({
  player,
  onAddPushups,
  onRemovePushups,
  onDelete,
  theme = 'cartoon',
  milestone = 1000,
}: PlayerCardProps) {
  const [inputValue, setInputValue] = useState('');
  const [removeValue, setRemoveValue] = useState('');
  const [todayTotal, setTodayTotal] = useState<number>(0);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const fetchTodayTotal = async () => {
    try {
      const response = await fetch(`/api/players/${player.id}/history`);
      if (!response.ok) return;
      const data = await response.json();
      if (data.length > 0) {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // Also check tomorrow's UTC date since late-night entries might be stored with tomorrow's date in UTC
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
        
        // Sum both today's and tomorrow's entries (if they exist) to handle UTC timezone split
        const total = data.reduce((sum: number, d: { date: string; total: number }) => {
          return (d.date === today || d.date === tomorrowStr) ? sum + d.total : sum;
        }, 0);
        
        setTodayTotal(total);
      } else {
        setTodayTotal(0);
      }
    } catch (error) {
      console.error('Error fetching today total:', error);
      setTodayTotal(0);
    }
  };

  useEffect(() => {
    fetchTodayTotal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.totalPushups]);

  const handleQuickAdd = (amount: number) => {
    onAddPushups(amount);
  };

  const handleCustomAdd = () => {
    const amount = parseInt(inputValue);
    if (!isNaN(amount) && amount > 0) {
      onAddPushups(amount);
      setInputValue('');
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${player.name}? This will remove all their pushup history.`)) {
      onDelete();
    }
  };

  const handleCustomRemove = () => {
    const amount = parseInt(removeValue);
    if (!isNaN(amount) && amount > 0) {
      onRemovePushups(amount);
      setRemoveValue('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-lg p-6 shadow-lg border hover:border-opacity-75 transition-all relative"
      style={{
        background:
          theme === 'christmas'
            ? 'linear-gradient(to bottom right, rgba(127, 29, 29, 0.6), rgba(20, 83, 45, 0.4), rgba(15, 35, 60, 0.3))'
            : 'linear-gradient(to bottom right, rgb(31, 41, 55), rgb(17, 24, 39))',
        borderColor:
          theme === 'christmas' ? 'rgb(239, 68, 68)' : 'rgb(55, 65, 81)',
      }}
    >
      {/* Crown Badge */}
      {player.totalPushups >= milestone && (
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
          className="absolute -top-3 -right-3 text-4xl"
          style={{
            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
          }}
          title={`🎉 Milestone reached: ${milestone}!`}
        >
          👑
        </motion.div>
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <AnimatedIcon
            emoji={getPlayerEmoji(player.name, theme)}
            animationType={getPlayerAnimation(player.id)}
            size="large"
          />
          <div>
            <h3 className="text-xl font-bold text-white">{player.name}</h3>
            <motion.p
              key={player.totalPushups}
              initial={{
                scale: 1.3,
                color: theme === 'christmas' ? '#FBBF24' : '#FFD700',
              }}
              animate={{ scale: 1, color: '#FFFFFF' }}
              transition={{ duration: 0.4 }}
              className="text-2xl font-bold"
            >
              {player.totalPushups}
            </motion.p>
            {todayTotal > 0 && (
              <motion.button
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsHistoryOpen(true)}
                className="text-sm mt-1 px-2 py-0.5 rounded flex items-center gap-1"
                style={{
                  backgroundColor:
                    theme === 'christmas'
                      ? 'rgba(34, 197, 94, 0.3)'
                      : 'rgba(59, 130, 246, 0.3)',
                  color: theme === 'christmas' ? 'rgb(134, 239, 172)' : 'rgb(147, 197, 253)',
                }}
              >
                <Calendar className="w-3 h-3" />
                Today: {todayTotal}
              </motion.button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 rounded-lg transition-colors"
            style={{
              backgroundColor:
                theme === 'christmas'
                  ? 'rgba(34, 197, 94, 0.2)'
                  : 'rgba(59, 130, 246, 0.2)',
            }}
            title="View daily history"
          >
            <Calendar
              className="w-5 h-5"
              style={{
                color:
                  theme === 'christmas'
                    ? 'rgb(134, 239, 172)'
                    : 'rgb(147, 197, 253)',
              }}
            />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            className="p-2 rounded-lg transition-colors"
            style={{
              backgroundColor:
                theme === 'christmas'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(239, 68, 68, 0.2)',
            }}
          >
            <Trash2
              className="w-5 h-5"
              style={{
                color:
                  theme === 'christmas'
                    ? 'rgb(252, 165, 165)'
                    : 'rgb(248, 113, 113)',
              }}
            />
          </motion.button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Quick buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[10, 20, 30, 50].map((amount) => (
            <motion.button
              key={`add-${amount}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleQuickAdd(amount)}
              className="font-bold py-2 rounded transition-colors border"
              style={{
                backgroundColor:
                  theme === 'christmas'
                    ? 'rgba(34, 197, 94, 0.2)'
                    : 'rgba(34, 197, 94, 0.2)',
                color:
                  theme === 'christmas'
                    ? 'rgb(186, 230, 253)'
                    : 'rgb(134, 239, 172)',
                borderColor:
                  theme === 'christmas'
                    ? 'rgba(34, 197, 94, 0.3)'
                    : 'rgba(34, 197, 94, 0.3)',
              }}
            >
              +{amount}
            </motion.button>
          ))}
        </div>

        {/* Custom add input */}
        <div className="flex gap-2">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCustomAdd();
              }
            }}
            placeholder="Custom amount"
            className="flex-1 rounded px-3 py-2 border outline-none transition-colors text-white"
            style={{
              backgroundColor:
                theme === 'christmas' ? 'rgb(20, 83, 45)' : 'rgb(55, 65, 81)',
              borderColor:
                theme === 'christmas' ? 'rgb(34, 197, 94)' : 'rgb(75, 85, 99)',
              color: 'white',
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCustomAdd}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </motion.button>
        </div>

        {/* Custom remove input */}
        <div className="flex gap-2">
          <input
            type="number"
            value={removeValue}
            onChange={(e) => setRemoveValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCustomRemove();
              }
            }}
            placeholder="Remove amount"
            className="flex-1 rounded px-3 py-2 border outline-none transition-colors text-white"
            style={{
              backgroundColor:
                theme === 'christmas' ? 'rgb(60, 20, 20)' : 'rgb(55, 30, 30)',
              borderColor:
                theme === 'christmas' ? 'rgb(239, 68, 68)' : 'rgb(239, 68, 68)',
              color: 'white',
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCustomRemove}
            className="bg-red-500/40 hover:bg-red-500/60 text-red-300 font-bold px-4 py-2 rounded transition-colors border border-red-500/30 flex items-center gap-2"
          >
            <Minus className="w-4 h-4" />
            Remove
          </motion.button>
        </div>
      </div>

      {/* Daily History Modal */}
      <DailyHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        playerId={player.id}
        playerName={player.name}
        theme={theme}
      />
    </motion.div>
  );
}
