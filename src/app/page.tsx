'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Plus, ChevronDown, ChevronUp, History } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import RaceTrack from '@/components/RaceTrack';
import AddPlayerModal from '@/components/AddPlayerModal';
import SessionSelectorModal from '@/components/SessionSelectorModal';
import CreateSessionModal from '@/components/CreateSessionModal';
import ChristmasBackground from '@/components/ChristmasBackground';
import CountdownTimer from '@/components/CountdownTimer';
import CelebrationEffect from '@/components/CelebrationEffect';
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
  const [isSessionSelectorOpen, setIsSessionSelectorOpen] = useState(false);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSessionName, setActiveSessionName] = useState<string>('');
  const [sessionType, setSessionType] = useState<'pushups' | 'plank'>(
    'pushups',
  );
  const [theme, setTheme] = useState<Theme>('cartoon');
  const [milestone, setMilestone] = useState<number>(1000);
  const [editingMilestone, setEditingMilestone] = useState(false);
  const [milestoneInput, setMilestoneInput] = useState('1000');
  const [headerExpanded, setHeaderExpanded] = useState(false);
  const [celebratingPlayer, setCelebratingPlayer] = useState<string | null>(
    null,
  );
  const [playersReachedMilestone, setPlayersReachedMilestone] = useState<
    Set<number>
  >(new Set());
  const playerCardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Fetch players and settings on mount (no auto-refresh)
  useEffect(() => {
    fetchPlayers();
    fetchSettings();
    fetchActiveSession();
  }, []);

  const fetchActiveSession = async () => {
    try {
      const response = await fetch('/api/sessions/active');
      if (response.ok) {
        const session = await response.json();
        setActiveSessionName(session.name);
        setSessionType(session.sessionType || 'pushups');
      } else {
        // No active session
        setActiveSessionName('');
        setSessionType('pushups');
      }
    } catch (err) {
      console.error('Failed to fetch active session:', err);
      setActiveSessionName('');
      setSessionType('pushups');
    }
  };

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/players');
      if (!response.ok) {
        if (response.status === 401) {
          // No active session, show session selector
          setIsSessionSelectorOpen(true);
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch players');
      }
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

  const scrollToPlayer = (playerId: number) => {
    const element = playerCardRefs.current[playerId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a brief highlight effect
      element.style.transform = 'scale(1.02)';
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 300);
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

  const handleAddPushups = async (
    playerId: number,
    amount: number,
    date?: string,
  ) => {
    try {
      const body: { amount: number; date?: string } = { amount };
      if (date) body.date = date;

      const response = await fetch(`/api/players/${playerId}/pushups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(
          errorData.details || errorData.error || 'Failed to update pushups',
        );
      }

      const updatedPlayer = await response.json();
      const previousPlayer = players.find((p) => p.id === playerId);

      // Check if player just reached milestone
      if (
        previousPlayer &&
        previousPlayer.totalPushups < milestone &&
        updatedPlayer.totalPushups >= milestone &&
        !playersReachedMilestone.has(playerId)
      ) {
        setCelebratingPlayer(updatedPlayer.name);
        setPlayersReachedMilestone((prev) => new Set(prev).add(playerId));

        // Auto-stop celebration after 2 minutes
        setTimeout(() => {
          setCelebratingPlayer(null);
        }, 120000);
      }

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

  const handleCreateSession = async (
    name: string,
    password: string,
    sessionType: 'pushups' | 'plank',
  ) => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password, sessionType }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create session');
      }

      setError('');
      setIsCreateSessionOpen(false);
      setIsSessionSelectorOpen(true);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create session');
    }
  };

  const handleSessionChange = () => {
    // Reload data after session change
    fetchPlayers();
    fetchSettings();
    fetchActiveSession();
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Mobile: Compact header with toggle */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between">
              {/* Logo, Title, and Milestone in one line */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Dumbbell
                    className="w-6 h-6 flex-shrink-0"
                    style={{
                      color:
                        theme === 'christmas'
                          ? 'rgb(253, 224, 71)'
                          : 'rgb(250, 204, 21)',
                    }}
                  />
                </motion.div>
                <h1
                  className="text-xl font-bold text-transparent bg-clip-text flex-shrink truncate"
                  style={{
                    backgroundImage:
                      theme === 'christmas'
                        ? 'linear-gradient(to right, rgb(253, 230, 138), rgb(220, 38, 38), rgb(96, 165, 250))'
                        : 'linear-gradient(to right, rgb(250, 204, 21), rgb(249, 115, 22))',
                  }}
                >
                  {sessionType === 'plank'
                    ? 'Plank Pos Battle'
                    : 'PushUp Battle'}
                </h1>
                {activeSessionName && (
                  <span className="text-xs font-medium text-blue-300 whitespace-nowrap flex-shrink-0 truncate max-w-[100px]">
                    {activeSessionName}
                  </span>
                )}
                {!editingMilestone && (
                  <span className="text-sm font-semibold text-white whitespace-nowrap flex-shrink-0">
                    🎯 M:{milestone}
                  </span>
                )}
              </div>

              {/* Toggle button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setHeaderExpanded(!headerExpanded)}
                className="ml-2 text-white flex-shrink-0"
              >
                {headerExpanded ? (
                  <ChevronUp className="w-6 h-6" />
                ) : (
                  <ChevronDown className="w-6 h-6" />
                )}
              </motion.button>
            </div>

            {/* Expandable section */}
            <AnimatePresence>
              {headerExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 space-y-3">
                    {/* Milestone Edit */}
                    <div className="flex items-center gap-2">
                      {!editingMilestone ? (
                        <>
                          <span className="text-base font-semibold text-white">
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

                    {/* Theme Buttons */}
                    <div className="flex gap-2" hidden>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTheme('cartoon')}
                        className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all"
                        style={{
                          backgroundColor:
                            theme === 'cartoon'
                              ? 'rgb(147, 51, 234)'
                              : 'rgb(55, 65, 81)',
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
                        className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all"
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
                    </div>

                    {/* Add Player Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsModalOpen(true)}
                      className="w-full text-white font-bold px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg"
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

                    {/* Session Management Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsSessionSelectorOpen(true)}
                      className="w-full text-white font-bold px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg"
                      style={{
                        backgroundColor: 'rgb(59, 130, 246)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'rgb(37, 99, 235)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'rgb(59, 130, 246)';
                      }}
                    >
                      <History className="w-5 h-5" />
                      Sessions
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop: Original layout */}
          <div className="hidden lg:block">
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
                  {sessionType === 'plank'
                    ? 'Plank Pos Battle'
                    : 'PushUp Battle'}
                </h1>
              </motion.div>

              {/* Active Session Name */}
              {activeSessionName && (
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <span className="text-sm font-medium text-blue-300">
                    Session:
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {activeSessionName}
                  </span>
                </div>
              )}

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
                <div className="flex gap-2" hidden>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTheme('cartoon')}
                    className="px-4 py-2 rounded-lg font-semibold transition-all"
                    style={{
                      backgroundColor:
                        theme === 'cartoon'
                          ? 'rgb(147, 51, 234)'
                          : 'rgb(55, 65, 81)',
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
                </div>

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

                {/* Session Management Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSessionSelectorOpen(true)}
                  className="text-white font-bold px-6 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg"
                  style={{
                    backgroundColor: 'rgb(59, 130, 246)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(37, 99, 235)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(59, 130, 246)';
                  }}
                >
                  <History className="w-5 h-5" />
                  Sessions
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Countdown Timer */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <CountdownTimer key={activeSessionName} theme={theme} />
      </div>

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
                    whileTap={{ scale: 0.98 }}
                    onClick={() => scrollToPlayer(champion.id)}
                    className="px-6 py-3 rounded-lg font-semibold text-lg backdrop-blur-sm cursor-pointer"
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
              {players.length > 0 && (
                <h2 className="text-2xl font-bold text-white mb-4">Players</h2>
              )}
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
                    <div
                      key={player.id}
                      ref={(el) => {
                        playerCardRefs.current[player.id] = el;
                      }}
                      style={{ transition: 'transform 0.3s ease' }}
                    >
                      <PlayerCard
                        player={player}
                        theme={theme}
                        milestone={milestone}
                        sessionType={sessionType}
                        onAddPushups={(amount, date) =>
                          handleAddPushups(player.id, amount, date)
                        }
                        onRemovePushups={(amount) =>
                          handleRemovePushups(player.id, amount)
                        }
                        onDelete={() => handleDeletePlayer(player.id)}
                      />
                    </div>
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

      {/* Session Management Modals */}
      <SessionSelectorModal
        isOpen={isSessionSelectorOpen}
        onClose={() => setIsSessionSelectorOpen(false)}
        onCreateNew={() => {
          setIsSessionSelectorOpen(false);
          setIsCreateSessionOpen(true);
        }}
        onSessionChange={handleSessionChange}
      />

      <CreateSessionModal
        isOpen={isCreateSessionOpen}
        onClose={() => setIsCreateSessionOpen(false)}
        onCreateSession={handleCreateSession}
      />

      {/* Celebration Effect */}
      <CelebrationEffect
        isActive={celebratingPlayer !== null}
        playerName={celebratingPlayer || undefined}
      />
    </div>
  );
}
