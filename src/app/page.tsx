'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Plus } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import RaceTrack from '@/components/RaceTrack';
import AddPlayerModal from '@/components/AddPlayerModal';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-30"
      >
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Dumbbell className="w-8 h-8 text-yellow-400" />
            </motion.div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              PushUp Battle
            </h1>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Player
          </motion.button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg"
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
                    className="text-center py-8 text-gray-400"
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
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddPlayer}
      />
    </div>
  );
}
