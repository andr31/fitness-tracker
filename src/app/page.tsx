'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Plus } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import RaceTrack from '@/components/RaceTrack';
import AddPlayerModal from '@/components/AddPlayerModal';
import ChristmasBackground from '@/components/ChristmasBackground';
import FloatingAIBalloon from '@/components/FloatingAIBalloon';
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
  const [milestone, setMilestone] = useState<number>(1000);
  const [editingMilestone, setEditingMilestone] = useState(false);
  const [milestoneInput, setMilestoneInput] = useState('1000');
  const [commentary, setCommentary] = useState<string>('');
  const [showCommentary, setShowCommentary] = useState(false);
  const [coachMessage, setCoachMessage] = useState<string>('');
  const [showCoachMessage, setShowCoachMessage] = useState(false);

  const generateCommentary = async () => {
    if (players.length === 0) return;
    try {
      const response = await fetch('/api/ai/commentator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players, milestone }),
      });
      if (response.ok) {
        const data = await response.json();
        setCommentary(data.commentary);
        setShowCommentary(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.details?.includes('Quota exceeded')) {
          console.log('⏳ AI quota reached - keeping last message until quota resets');
        }
        // Keep showing last message on error (don't hide)
      }
    } catch (error) {
      console.warn('AI Commentary unavailable - keeping last message:', error);
      // Keep showing last message on error (don't hide)
    }
  };

  // Fetch players and settings on mount
  useEffect(() => {
    fetchPlayers();
    fetchSettings();

    // Auto-refresh every 5 minutes
    const intervalId = setInterval(() => {
      fetchPlayers();
      fetchSettings();
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    // Cleanup intervals on unmount
    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Generate new commentary every 2 minutes when players exist
  useEffect(() => {
    if (players.length === 0) return;
    
    // Generate immediately on mount or when players change
    generateCommentary();
    
    // Then generate every 2 minutes (to avoid Gemini quota limits)
    const commentaryInterval = setInterval(() => {
      generateCommentary();
    }, 120 * 1000);

    return () => {
      clearInterval(commentaryInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.length]);


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

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      if (data.milestone) {
        const milestoneValue = parseInt(data.milestone);
        setMilestone(milestoneValue);
        setMilestoneInput(milestoneValue.toString());
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSaveMilestone = async () => {
    const value = parseInt(milestoneInput);
    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid milestone');
      return;
    }

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'milestone', value: value.toString() }),
      });

      if (!response.ok) throw new Error('Failed to save milestone');

      setMilestone(value);
      setEditingMilestone(false);
      setError('');
    } catch (err) {
      setError('Failed to save milestone');
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

  const handleAddPushups = async (playerId: number, amount: number, date?: string) => {
    try {
      const body: { amount: number; date?: string } = { amount };
      if (date) body.date = date;
      
      const response = await fetch(`/api/players/${playerId}/pushups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

            {/* Milestone Display */}
            <div className="flex items-center gap-3">
              {!editingMilestone ? (
                <>
                  <span className="text-lg font-semibold text-white">
                    🎯 Milestone: {milestone}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setEditingMilestone(true);
                      setMilestoneInput(milestone.toString());
                    }}
                    className="text-white hover:text-yellow-300 transition-colors"
                  >
                    ✏️
                  </motion.button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={milestoneInput}
                    onChange={(e) => setMilestoneInput(e.target.value)}
                    className="w-24 px-3 py-1 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-yellow-500"
                    min="1"
                    autoFocus
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSaveMilestone}
                    className="text-green-400 hover:text-green-300 text-xl"
                  >
                    ✓
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setEditingMilestone(false)}
                    className="text-red-400 hover:text-red-300 text-xl"
                  >
                    ✕
                  </motion.button>
                </div>
              )}
            </div>

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

      {/* Champions Banner */}
      {players.filter((p) => p.totalPushups >= milestone).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto px-4 mt-4"
        >
          <div
            className="rounded-lg p-6 backdrop-blur-md border"
            style={{
              background:
                theme === 'christmas'
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(220, 38, 38, 0.2))'
                  : 'linear-gradient(135deg, rgba(250, 204, 21, 0.2), rgba(249, 115, 22, 0.2))',
              borderColor:
                theme === 'christmas'
                  ? 'rgba(34, 197, 94, 0.3)'
                  : 'rgba(250, 204, 21, 0.3)',
            }}
          >
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              🏆 Champions - Milestone Reached! 🏆
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {players
                .filter((p) => p.totalPushups >= milestone)
                .map((champion) => (
                  <motion.div
                    key={champion.id}
                    whileHover={{ scale: 1.05 }}
                    className="px-6 py-3 rounded-lg font-semibold text-lg backdrop-blur-sm"
                    style={{
                      background:
                        theme === 'christmas'
                          ? 'rgba(34, 197, 94, 0.3)'
                          : 'rgba(250, 204, 21, 0.3)',
                      color: 'white',
                      border: '2px solid',
                      borderColor:
                        theme === 'christmas'
                          ? 'rgb(34, 197, 94)'
                          : 'rgb(250, 204, 21)',
                    }}
                  >
                    🎖️ {champion.name} - {champion.totalPushups} pushups
                  </motion.div>
                ))}
            </div>
          </div>
        </motion.div>
      )}

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
                      milestone={milestone}
                      allPlayers={players}
                      onAddPushups={(amount, date) =>
                        handleAddPushups(player.id, amount, date)
                      }
                      onRemovePushups={(amount) =>
                        handleRemovePushups(player.id, amount)
                      }
                      onDelete={() => handleDeletePlayer(player.id)}
                      onCoachMessage={(message) => {
                        setCoachMessage(message);
                        setShowCoachMessage(true);
                        setTimeout(() => setShowCoachMessage(false), 10000);
                      }}
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

      {/* Floating AI Balloons */}
      <FloatingAIBalloon
        message={commentary}
        type="commentator"
        isVisible={showCommentary}
        theme={theme}
      />
      <FloatingAIBalloon
        message={coachMessage}
        type="coach"
        isVisible={showCoachMessage}
        theme={theme}
      />
    </div>
  );
}
