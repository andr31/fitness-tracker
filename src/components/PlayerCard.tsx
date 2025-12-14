'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Trash2, Calendar } from 'lucide-react';
import AnimatedIcon from './AnimatedIcon';
import DailyHistoryModal from './DailyHistoryModal';
import DailyGoalStatsModal from './DailyGoalStatsModal';
import EncouragementAnimation from './EncouragementAnimation';
import { getPlayerEmoji, getPlayerAnimation, Theme } from '@/lib/emojis';

interface Player {
  id: number;
  name: string;
  totalPushups: number;
}

interface PlayerCardProps {
  player: Player;
  onAddPushups: (amount: number, date?: string) => void;
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
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Daily Goal states
  const [dailyGoal, setDailyGoal] = useState<number>(100);
  const [dailyGoalProgress, setDailyGoalProgress] = useState<number>(0);
  const [dailyGoalInput, setDailyGoalInput] = useState('');
  const [editingDailyGoal, setEditingDailyGoal] = useState(false);
  const [showDailyGoalSection, setShowDailyGoalSection] = useState(false);
  const [sliderValue, setSliderValue] = useState<number>(10);
  const [dailyGoalsMet, setDailyGoalsMet] = useState<number>(0);
  const [isGoalStatsModalOpen, setIsGoalStatsModalOpen] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);

  const fetchTodayTotal = async () => {
    try {
      const response = await fetch(`/api/players/${player.id}/history`);
      if (!response.ok) return;
      const data = await response.json();
      if (data.length > 0) {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        const todayEntry = data.find((d: { date: string; total: number }) => d.date === today);
        setTodayTotal(todayEntry ? todayEntry.total : 0);
      } else {
        setTodayTotal(0);
      }
    } catch (error) {
      console.error('Error fetching today total:', error);
      setTodayTotal(0);
    }
  };

  const fetchDailyGoal = async () => {
    try {
      const response = await fetch(`/api/players/${player.id}/daily-goal-settings`);
      if (!response.ok) return;
      const data = await response.json();
      setDailyGoal(data.dailyGoal);
    } catch (error) {
      console.error('Error fetching daily goal:', error);
    }
  };

  const fetchDailyGoalProgress = async () => {
    try {
      // Pass the client's local date to avoid timezone issues
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const response = await fetch(`/api/players/${player.id}/daily-goal?date=${todayStr}`);
      if (!response.ok) return;
      const data = await response.json();
      setDailyGoalProgress(data.total);
    } catch (error) {
      console.error('Error fetching daily goal progress:', error);
    }
  };

  const fetchDailyGoalStats = async () => {
    try {
      const response = await fetch(`/api/players/${player.id}/daily-goal-stats`);
      if (!response.ok) return;
      const data = await response.json();
      setDailyGoalsMet(data.goalsMet);
    } catch (error) {
      console.error('Error fetching daily goal stats:', error);
    }
  };

  const handleSaveDailyGoal = async () => {
    const newGoal = parseInt(dailyGoalInput);
    if (!isNaN(newGoal) && newGoal > 0) {
      try {
        const response = await fetch(`/api/players/${player.id}/daily-goal-settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dailyGoal: newGoal }),
        });
        if (response.ok) {
          setDailyGoal(newGoal);
          setEditingDailyGoal(false);
        }
      } catch (error) {
        console.error('Error saving daily goal:', error);
      }
    }
  };

  const handleAddDailyGoal = async (amount: number) => {
    try {
      const response = await fetch(`/api/players/${player.id}/daily-goal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, dailyGoalTarget: dailyGoal }),
      });
      if (response.ok) {
        fetchDailyGoalProgress();
        fetchDailyGoalStats();
      }
    } catch (error) {
      console.error('Error adding daily goal:', error);
    }
  };

  const handleRemoveDailyGoal = async (amount: number) => {
    if (dailyGoalProgress > 0) {
      // Don't remove more than current progress (prevent negative values)
      const amountToRemove = Math.min(amount, dailyGoalProgress);
      await handleAddDailyGoal(-amountToRemove);
    }
  };

  useEffect(() => {
    fetchTodayTotal();
    fetchDailyGoal();
    fetchDailyGoalProgress();
    fetchDailyGoalStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.totalPushups]);

  const showEncouragementAnimation = () => {
    setShowEncouragement(true);
    setTimeout(() => setShowEncouragement(false), 2000);
  };

  const handleQuickAdd = (amount: number) => {
    onAddPushups(amount, selectedDate || undefined);
    showEncouragementAnimation();
    if (selectedDate) {
      setSelectedDate('');
      setShowDatePicker(false);
    }
  };

  const handleCustomAdd = () => {
    const amount = parseInt(inputValue);
    if (!isNaN(amount) && amount > 0) {
      onAddPushups(amount, selectedDate || undefined);
      showEncouragementAnimation();
      setInputValue('');
      if (selectedDate) {
        setSelectedDate('');
        setShowDatePicker(false);
      }
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
      {/* Crown Badge (Milestone) */}
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

      {/* Daily Goal Badge */}
      {dailyGoalProgress >= dailyGoal && (
        <motion.div
          initial={{ scale: 0, rotate: 180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
          className="absolute -top-3 -left-3 text-4xl"
          style={{
            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
          }}
          title={`🎯 Daily goal reached: ${dailyGoal}!`}
        >
          ⭐
        </motion.div>
      )}

      {/* Encouragement Animation */}
      <EncouragementAnimation
        show={showEncouragement}
        theme={theme}
      />
      
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
        {/* Date Picker Toggle */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowDatePicker(!showDatePicker);
              if (showDatePicker) setSelectedDate('');
            }}
            className="px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2"
            style={{
              backgroundColor: showDatePicker
                ? theme === 'christmas'
                  ? 'rgba(34, 197, 94, 0.3)'
                  : 'rgba(59, 130, 246, 0.3)'
                : theme === 'christmas'
                ? 'rgba(55, 65, 81, 0.5)'
                : 'rgba(55, 65, 81, 0.5)',
              color: 'white',
            }}
          >
            <Calendar className="w-4 h-4" />
            {showDatePicker ? 'Cancel' : 'Pick Date'}
          </motion.button>
          {showDatePicker && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="px-3 py-1.5 rounded text-sm outline-none"
              style={{
                backgroundColor:
                  theme === 'christmas' ? 'rgb(20, 83, 45)' : 'rgb(55, 65, 81)',
                borderColor:
                  theme === 'christmas' ? 'rgb(34, 197, 94)' : 'rgb(75, 85, 99)',
                color: 'white',
              }}
            />
          )}
          {selectedDate && (
            <span className="text-xs text-white opacity-70">
              Adding to: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

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

      {/* Daily Goal Section */}
      <div className="mt-6 pt-6 border-t" style={{ borderColor: theme === 'christmas' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(75, 85, 99, 0.3)' }}>
        <button
          onClick={() => setShowDailyGoalSection(!showDailyGoalSection)}
          className="w-full flex items-center justify-between text-white mb-3"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold">🎯 Daily Goal</span>
            {!editingDailyGoal && (
              <span className="text-sm opacity-70">({dailyGoalProgress}/{dailyGoal})</span>
            )}
            {dailyGoalProgress >= dailyGoal && <span className="text-xl">⭐</span>}
          </div>
          <motion.div
            animate={{ rotate: showDailyGoalSection ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.div>
        </button>

        {/* Goals Met Pill */}
        {dailyGoalsMet > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsGoalStatsModalOpen(true)}
            className="mb-3 px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
            style={{
              backgroundColor: theme === 'christmas' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
              color: theme === 'christmas' ? 'rgb(134, 239, 172)' : 'rgb(147, 197, 253)',
              border: `1px solid ${theme === 'christmas' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
            }}
          >
            🏆 {dailyGoalsMet} {dailyGoalsMet === 1 ? 'day' : 'days'} goal met
          </motion.button>
        )}

        {showDailyGoalSection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <p className="text-xs text-white opacity-50 italic">
              ℹ️ Main entries do not count for daily goals
            </p>
            
            {/* Goal Setting */}
            <div className="flex items-center gap-2">
              {!editingDailyGoal ? (
                <>
                  <span className="text-sm text-white opacity-70">Target: {dailyGoal}</span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setEditingDailyGoal(true);
                      setDailyGoalInput(dailyGoal.toString());
                    }}
                    className="text-white hover:text-yellow-300 transition-colors text-sm"
                  >
                    ✏️ Edit
                  </motion.button>
                </>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="number"
                    value={dailyGoalInput}
                    onChange={(e) => setDailyGoalInput(e.target.value)}
                    className="w-24 px-2 py-1 rounded text-sm bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-yellow-500"
                    min="1"
                    autoFocus
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSaveDailyGoal}
                    className="text-green-400 hover:text-green-300"
                  >
                    ✓
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setEditingDailyGoal(false)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </motion.button>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((dailyGoalProgress / dailyGoal) * 100, 100)}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full"
                style={{
                  background: dailyGoalProgress >= dailyGoal
                    ? 'linear-gradient(to right, rgb(34, 197, 94), rgb(22, 163, 74))'
                    : 'linear-gradient(to right, rgb(59, 130, 246), rgb(37, 99, 235))',
                }}
              />
            </div>

            {/* Slider Add Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-white opacity-70">
                <span>Add:</span>
                <span className="font-bold" style={{ color: 'rgb(147, 197, 253)' }}>+{sliderValue}</span>
              </div>
              <input
                type="range"
                min="1"
                max="70"
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${(sliderValue / 70) * 100}%, rgb(55, 65, 81) ${(sliderValue / 70) * 100}%, rgb(55, 65, 81) 100%)`,
                }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAddDailyGoal(sliderValue)}
                className="w-full font-bold py-2 rounded transition-colors border text-sm"
                style={{
                  backgroundColor: theme === 'christmas' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  color: 'rgb(147, 197, 253)',
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                }}
              >
                Add +{sliderValue}
              </motion.button>
            </div>

            {/* Remove Buttons */}
            {dailyGoalProgress > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 50].map((amount) => (
                  <motion.button
                    key={`daily-remove-${amount}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRemoveDailyGoal(amount)}
                    className="font-bold py-2 rounded transition-colors border text-sm"
                    style={{
                      backgroundColor: theme === 'christmas' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: 'rgb(252, 165, 165)',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    -{amount}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Daily History Modal */}
      <DailyHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        playerId={player.id}
        playerName={player.name}
        theme={theme}
      />

      {/* Daily Goal Stats Modal */}
      <DailyGoalStatsModal
        isOpen={isGoalStatsModalOpen}
        onClose={() => setIsGoalStatsModalOpen(false)}
        playerId={player.id}
        playerName={player.name}
        theme={theme}
      />
    </motion.div>
  );
}
