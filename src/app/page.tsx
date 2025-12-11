'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Plus } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import RaceTrack from '@/components/RaceTrack';
import AddPlayerModal from '@/components/AddPlayerModal';
import ChristmasBackground from '@/components/ChristmasBackground';
import { Theme } from '@/lib/emojis';
import './theme.css';

interface Player {
  id: number;
  name: string;
  totalPushups: number;
  dailyTarget?: number;
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<Theme>('christmas');
  const [milestone, setMilestone] = useState(0);
  const [milestoneInput, setMilestoneInput] = useState('');
  const [todayPushups, setTodayPushups] = useState<Record<number, number>>({});

  // Fetch players on mount
  useEffect(() => {
    fetchPlayers();
    fetchTodayPushups();
    fetchSettings();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/players');
      if (!response.ok) throw new Error('Failed to fetch players');
      const data = await response.json();
      setPlayers(data);
      setError('');
    } catch (err) {
      setError('Failed to load players');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayPushups = async () => {
    try {
      const response = await fetch('/api/players');
      if (!response.ok) return;
      const allPlayers = await response.json();
      
      const todayData: Record<number, number> = {};
      
      for (const player of allPlayers) {
        const historyResponse = await fetch(`/api/players/${player.id}/history`);
        if (historyResponse.ok) {
          const history = await historyResponse.json();
          const today = new Date().toISOString().split('T')[0];
          const todayEntry = history.find((h: any) => h.date === today);
          todayData[player.id] = todayEntry ? todayEntry.total : 0;
        }
      }
      
      setTodayPushups(todayData);
    } catch (err) {
      console.error('Failed to fetch today\'s pushups', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings?key=milestone');
      if (!response.ok) return;
      const data = await response.json();
      
      if (data.value) {
        const milestoneValue = parseInt(data.value);
        setMilestone(milestoneValue);
        setMilestoneInput(milestoneValue.toString());
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const updateMilestone = async (newMilestone: number) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'milestone', value: newMilestone.toString() }),
      });

      if (!response.ok) throw new Error('Failed to update milestone');

      setMilestone(newMilestone);
      setMilestoneInput(newMilestone.toString());
    } catch (err) {
      setError('Failed to update milestone');
      console.error(err);
    }
  };

  const handleAddPlayer = async (name: string) => {
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add player');
      }

      const newPlayer = await response.json();
      setPlayers([...players, newPlayer]);
      setIsModalOpen(false);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to add player');
    }
  };

  const handleAddPushups = async (playerId: number, amount: number) => {
    try {
      const response = await fetch(`/api/players/${playerId}/pushups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) throw new Error('Failed to update pushups');

      // Refetch all players to ensure proper sorting and fresh data
      await fetchPlayers();
      
      // Refetch today's pushups for this player to ensure accuracy
      const historyResponse = await fetch(`/api/players/${playerId}/history`);
      if (historyResponse.ok) {
        const history = await historyResponse.json();
        const today = new Date().toISOString().split('T')[0];
        const todayEntry = history.find((h: any) => h.date === today);
        setTodayPushups((prev) => ({
          ...prev,
          [playerId]: todayEntry ? todayEntry.total : 0,
        }));
      }
    } catch (err) {
      setError('Failed to update pushups');
      console.error(err);
    }
  };

  const handleRemovePushups = async (playerId: number, amount: number) => {
    const player = players.find((p) => p.id === playerId);
    if (player && player.totalPushups > 0) {
      handleAddPushups(playerId, -amount);
    }
  };

  const handleDeletePlayer = async (playerId: number) => {
    try {
      const response = await fetch(`/api/players/${playerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete player');

      setPlayers(players.filter((p) => p.id !== playerId));
    } catch (err) {
      setError('Failed to delete player');
      console.error(err);
    }
  };

  const handleUpdateTarget = async (playerId: number, target: number) => {
    try {
      const response = await fetch(`/api/players/${playerId}/target`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyTarget: target }),
      });

      if (!response.ok) throw new Error('Failed to update target');

      const updatedPlayer = await response.json();
      setPlayers(players.map((p) => (p.id === playerId ? updatedPlayer : p)));
    } catch (err) {
      setError('Failed to update target');
      console.error(err);
    }
  };

  return (
    <div
      data-theme={theme}
      className="min-h-screen bg-gradient-to-br"
      style={{
        backgroundImage:
          theme === 'christmas'
            ? 'linear-gradient(to bottom right, rgb(127, 29, 29), rgb(20, 83, 45), rgb(15, 35, 60))'
            : 'linear-gradient(to bottom right, rgb(17, 24, 39), rgb(31, 41, 55), rgb(0, 0, 0))',
      }}
    >
      {/* Christmas decorations */}
      {theme === 'christmas' && <ChristmasBackground />}
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-sm border-b sticky top-0 z-30"
        style={{
          backgroundColor:
            theme === 'christmas'
              ? 'rgba(100, 35, 35, 0.8)'
              : 'rgba(31, 41, 55, 0.5)',
          borderColor:
            theme === 'christmas' ? 'rgb(220, 38, 38)' : 'rgb(55, 65, 81)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Title and Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Dumbbell
                  className="w-8 h-8"
                  style={{
                    color:
                      theme === 'christmas'
                        ? 'rgb(253, 224, 71)'
                        : 'rgb(250, 204, 21)',
                  }}
                />
              </motion.div>
              <h1
                className="text-4xl font-bold text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    theme === 'christmas'
                      ? 'linear-gradient(to right, rgb(253, 230, 138), rgb(220, 38, 38), rgb(96, 165, 250))'
                      : 'linear-gradient(to right, rgb(250, 204, 21), rgb(249, 115, 22))',
                }}
              >
                PushUp Battle
              </h1>
            </motion.div>

            {/* Theme Switcher and Add Button */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Theme Buttons */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTheme('cartoon')}
                className="px-4 py-2 rounded-lg font-semibold transition-all"
                style={{
                  backgroundColor:
                    theme === 'cartoon' ? 'rgb(147, 51, 234)' : 'rgb(55, 65, 81)',
                  color: 'white',
                  boxShadow:
                    theme === 'cartoon'
                      ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      : 'none',
                }}
              >
                🤖 Cartoon
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTheme('christmas')}
                className="px-4 py-2 rounded-lg font-semibold transition-all"
                style={{
                  backgroundColor:
                    theme === 'christmas'
                      ? 'rgb(34, 197, 94)'
                      : 'rgb(55, 65, 81)',
                  color: 'white',
                  boxShadow:
                    theme === 'christmas'
                      ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      : 'none',
                }}
              >
                🎄 Christmas
              </motion.button>

              {/* Add Player Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="text-white font-bold px-6 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg"
                style={{
                  backgroundColor:
                    theme === 'christmas'
                      ? 'rgb(34, 197, 94)'
                      : 'rgb(34, 197, 94)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    theme === 'christmas'
                      ? 'rgb(22, 163, 74)'
                      : 'rgb(22, 163, 74)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    theme === 'christmas'
                      ? 'rgb(34, 197, 94)'
                      : 'rgb(34, 197, 94)';
                }}
              >
                <Plus className="w-5 h-5" />
                Add Player
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Milestone Winners Banner */}
      {players.some(p => p.totalPushups >= milestone) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto px-4 pt-6"
        >
          <div
            className="rounded-lg p-6 border-2 shadow-xl"
            style={{
              background:
                theme === 'christmas'
                  ? 'linear-gradient(to right, rgba(253, 224, 71, 0.2), rgba(220, 38, 38, 0.2), rgba(253, 224, 71, 0.2))'
                  : 'linear-gradient(to right, rgba(250, 204, 21, 0.2), rgba(249, 115, 22, 0.2), rgba(250, 204, 21, 0.2))',
              borderColor:
                theme === 'christmas'
                  ? 'rgb(253, 224, 71)'
                  : 'rgb(250, 204, 21)',
            }}
          >
            <h2 className="text-2xl font-bold text-center mb-4" style={{ color: theme === 'christmas' ? 'rgb(253, 224, 71)' : 'rgb(250, 204, 21)' }}>
              🏆 Milestone Champions! 🏆
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {players.filter(p => p.totalPushups >= milestone).map(player => (
                <motion.div
                  key={player.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor:
                      theme === 'christmas'
                        ? 'rgba(34, 197, 94, 0.3)'
                        : 'rgba(250, 204, 21, 0.3)',
                  }}
                >
                  <span className="text-3xl">👑</span>
                  <span className="text-white font-bold">{player.name}</span>
                  <span className="text-yellow-300">{player.totalPushups}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Milestone Input */}
        <div className="mb-6">
          <div
            className="rounded-lg p-4 flex items-center justify-between gap-4"
            style={{
              backgroundColor:
                theme === 'christmas'
                  ? 'rgba(100, 35, 35, 0.6)'
                  : 'rgba(31, 41, 55, 0.6)',
              border:
                theme === 'christmas'
                  ? '1px solid rgb(220, 38, 38)'
                  : '1px solid rgb(55, 65, 81)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              <div>
                <h3 className="text-white font-bold">Team Milestone</h3>
                <p className="text-gray-300 text-sm">
                  Current goal: <span className="font-bold text-yellow-400">{milestone}</span> pushups
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={milestoneInput}
                onChange={(e) => setMilestoneInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const newMilestone = parseInt(milestoneInput) || 500;
                    updateMilestone(newMilestone);
                  }
                }}
                placeholder="New goal"
                className="w-24 px-3 py-2 rounded border outline-none text-white"
                style={{
                  backgroundColor:
                    theme === 'christmas' ? 'rgb(20, 83, 45)' : 'rgb(55, 65, 81)',
                  borderColor:
                    theme === 'christmas' ? 'rgb(34, 197, 94)' : 'rgb(75, 85, 99)',
                }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const newMilestone = parseInt(milestoneInput) || 500;
                  updateMilestone(newMilestone);
                }}
                className="px-4 py-2 rounded font-semibold text-white"
                style={{
                  backgroundColor:
                    theme === 'christmas'
                      ? 'rgb(34, 197, 94)'
                      : 'rgb(59, 130, 246)',
                }}
              >
                Set
              </motion.button>
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg"
            style={{
              backgroundColor:
                theme === 'christmas'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(239, 68, 68, 0.2)',
              borderColor:
                theme === 'christmas'
                  ? 'rgba(239, 68, 68, 0.5)'
                  : 'rgba(239, 68, 68, 0.5)',
              borderWidth: '1px',
              color:
                theme === 'christmas'
                  ? 'rgb(254, 226, 226)'
                  : 'rgb(254, 226, 226)',
            }}
          >
            {error}
          </motion.div>
        )}

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center h-96"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-12 h-12 border-4 border-gray-700 border-t-yellow-400 rounded-full"
            />
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side - Players */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Players</h2>
              <AnimatePresence>
                {players.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8"
                    style={{
                      color:
                        theme === 'christmas'
                          ? 'rgb(254, 226, 226)'
                          : 'rgb(156, 163, 175)',
                    }}
                  >
                    <p className="mb-4">No players yet!</p>
                    <p className="text-sm">
                      Click "Add Player" to get started 🚀
                    </p>
                  </motion.div>
                ) : (
                  players.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      theme={theme}
                      todayPushups={todayPushups[player.id] || 0}
                      milestone={milestone}
                      onAddPushups={(amount) =>
                        handleAddPushups(player.id, amount)
                      }
                      onRemovePushups={(amount) =>
                        handleRemovePushups(player.id, amount)
                      }
                      onDelete={() => handleDeletePlayer(player.id)}
                      onUpdateTarget={(target) =>
                        handleUpdateTarget(player.id, target)
                      }
                    />
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Right side - Race Track */}
            <div className="lg:col-span-2">
              <RaceTrack players={players} />
            </div>
          </div>
        )}
      </main>

      {/* Add Player Modal */}
      <AddPlayerModal
        isOpen={isModalOpen}
        theme={theme}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddPlayer}
      />
    </div>
  );
}
