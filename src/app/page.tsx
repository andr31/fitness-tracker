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
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<Theme>('christmas');

  // Fetch players on mount
  useEffect(() => {
    fetchPlayers();
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

      const updatedPlayer = await response.json();
      setPlayers(players.map((p) => (p.id === playerId ? updatedPlayer : p)));
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
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
                      onAddPushups={(amount) =>
                        handleAddPushups(player.id, amount)
                      }
                      onRemovePushups={(amount) =>
                        handleRemovePushups(player.id, amount)
                      }
                      onDelete={() => handleDeletePlayer(player.id)}
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
