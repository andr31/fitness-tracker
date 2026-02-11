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
import BattleBackground from '@/components/BattleBackground';
import CountdownTimer from '@/components/CountdownTimer';
import StopwatchWidget from '@/components/StopwatchWidget';
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
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('fitness-tracker-theme');
      return (savedTheme as Theme) || 'gameofthrones';
    }
    return 'gameofthrones';
  });
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
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

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('fitness-tracker-theme', theme);
  }, [theme]);

  // Prevent body scroll when modals are open
  useEffect(() => {
    const anyModalOpen = isModalOpen || isSessionSelectorOpen;
    if (anyModalOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
  }, [isModalOpen, isSessionSelectorOpen]);

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
      if (!response.ok) return; // No active session or settings not available yet
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
          theme === 'gameofthrones'
            ? 'linear-gradient(to bottom right, rgb(0, 0, 0), rgb(15, 23, 42), rgb(28, 25, 23), rgb(0, 0, 0))'
            : theme === 'christmas'
              ? 'linear-gradient(to bottom right, rgb(127, 29, 29), rgb(20, 83, 45), rgb(15, 35, 60))'
              : 'linear-gradient(to bottom right, rgb(17, 24, 39), rgb(31, 41, 55), rgb(0, 0, 0))',
      }}
    >
      {/* Theme backgrounds */}
      {theme === 'christmas' && <ChristmasBackground />}
      {theme === 'gameofthrones' && <BattleBackground />}
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-sm border-b sticky top-0 z-30"
        style={{
          backgroundColor:
            theme === 'gameofthrones'
              ? 'rgba(15, 23, 42, 0.9)'
              : theme === 'christmas'
                ? 'rgba(100, 35, 35, 0.8)'
                : 'rgba(31, 41, 55, 0.5)',
          borderColor:
            theme === 'gameofthrones'
              ? 'rgb(120, 53, 15)'
              : theme === 'christmas'
                ? 'rgb(220, 38, 38)'
                : 'rgb(55, 65, 81)',
          boxShadow:
            theme === 'gameofthrones'
              ? '0 4px 6px -1px rgba(217, 119, 6, 0.2)'
              : 'none',
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
                        theme === 'gameofthrones'
                          ? 'rgb(245, 158, 11)'
                          : theme === 'christmas'
                            ? 'rgb(253, 224, 71)'
                            : 'rgb(250, 204, 21)',
                    }}
                  />
                </motion.div>
                <h1
                  className="text-xl font-bold text-transparent bg-clip-text flex-shrink truncate"
                  style={{
                    backgroundImage:
                      theme === 'gameofthrones'
                        ? 'linear-gradient(to right, rgb(245, 158, 11), rgb(217, 119, 6), rgb(180, 83, 9))'
                        : theme === 'christmas'
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
                {activeSessionName && !editingMilestone && (
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
                    {activeSessionName && (
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
                              onChange={(e) =>
                                setMilestoneInput(e.target.value)
                              }
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
                    )}

                    {/* Theme Dropdown */}
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                        className="w-full px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-between gap-2"
                        style={{
                          backgroundColor: 'rgb(55, 65, 81)',
                          color: 'white',
                        }}
                      >
                        <span>
                          {theme === 'cartoon' && '🤖 Cartoon'}
                          {theme === 'christmas' && '🎄 Christmas'}
                          {theme === 'gameofthrones' && '🐉 GoT'}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${themeDropdownOpen ? 'rotate-180' : ''}`}
                        />
                      </motion.button>
                      <AnimatePresence>
                        {themeDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="fixed left-4 right-4 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 overflow-hidden"
                            style={{
                              top: 'auto',
                              marginTop: '0.5rem',
                              zIndex: 9999,
                            }}
                          >
                            {['cartoon', 'christmas', 'gameofthrones'].map(
                              (t) => (
                                <button
                                  key={t}
                                  onClick={() => {
                                    setTheme(t as Theme);
                                    setThemeDropdownOpen(false);
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors font-semibold border-b border-gray-700 last:border-b-0"
                                  style={{
                                    backgroundColor:
                                      theme === t
                                        ? 'rgba(147, 51, 234, 0.2)'
                                        : 'transparent',
                                    color: 'white',
                                  }}
                                >
                                  {t === 'cartoon' && '🤖 Cartoon'}
                                  {t === 'christmas' && '🎄 Christmas'}
                                  {t === 'gameofthrones' &&
                                    '🐉 Game of Thrones'}
                                </button>
                              ),
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Add Player Button */}
                    {activeSessionName && (
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
                    )}

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
            <div className="flex items-center justify-between gap-6">
              {/* Left: Title and Logo */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 flex-shrink-0"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Dumbbell
                    className="w-8 h-8"
                    style={{
                      color:
                        theme === 'gameofthrones'
                          ? 'rgb(245, 158, 11)'
                          : theme === 'christmas'
                            ? 'rgb(253, 224, 71)'
                            : 'rgb(250, 204, 21)',
                    }}
                  />
                </motion.div>
                <h1
                  className="text-3xl font-bold text-transparent bg-clip-text whitespace-nowrap"
                  style={{
                    backgroundImage:
                      theme === 'gameofthrones'
                        ? 'linear-gradient(to right, rgb(245, 158, 11), rgb(217, 119, 6), rgb(180, 83, 9))'
                        : theme === 'christmas'
                          ? 'linear-gradient(to right, rgb(253, 230, 138), rgb(220, 38, 38), rgb(96, 165, 250))'
                          : 'linear-gradient(to right, rgb(250, 204, 21), rgb(249, 115, 22))',
                  }}
                >
                  {sessionType === 'plank'
                    ? 'Plank Pos Battle'
                    : 'PushUp Battle'}
                </h1>
              </motion.div>

              {/* Center: Session Name and Milestone */}
              <div className="flex items-center gap-6 flex-1 justify-center">
                {/* Active Session Name */}
                {activeSessionName && (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      borderColor: 'rgba(59, 130, 246, 0.4)',
                    }}
                  >
                    <span className="text-xs font-medium text-blue-300">
                      Session:
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {activeSessionName}
                    </span>
                  </div>
                )}

                {/* Milestone Display */}
                {activeSessionName && (
                  <div className="flex items-center gap-2">
                    {!editingMilestone ? (
                      <>
                        <span className="text-base font-semibold text-white whitespace-nowrap">
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
                )}
              </div>

              {/* Right: Theme and Action Buttons */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Theme Dropdown */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                    className="px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
                    style={{
                      backgroundColor: 'rgb(55, 65, 81)',
                      color: 'white',
                    }}
                  >
                    <span>
                      {theme === 'cartoon' && '🤖 Cartoon'}
                      {theme === 'christmas' && '🎄 Christmas'}
                      {theme === 'gameofthrones' && '🐉 GoT'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${themeDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </motion.button>
                  <AnimatePresence>
                    {themeDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50"
                      >
                        {['cartoon', 'christmas', 'gameofthrones'].map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              setTheme(t as Theme);
                              setThemeDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors font-semibold"
                            style={{
                              backgroundColor:
                                theme === t
                                  ? 'rgba(147, 51, 234, 0.2)'
                                  : 'transparent',
                              color: 'white',
                            }}
                          >
                            {t === 'cartoon' && '🤖 Cartoon'}
                            {t === 'christmas' && '🎄 Christmas'}
                            {t === 'gameofthrones' && '🐉 Game of Thrones'}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Add Player Button */}
                {activeSessionName && (
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
                )}

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

      {/* Show session-dependent content only when a session is active */}
      {!activeSessionName && !loading ? (
        <div className="max-w-7xl mx-auto px-4 mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 rounded-xl border backdrop-blur-md"
            style={{
              background:
                theme === 'gameofthrones'
                  ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.7), rgba(28, 25, 23, 0.5))'
                  : theme === 'christmas'
                    ? 'linear-gradient(135deg, rgba(127, 29, 29, 0.5), rgba(20, 83, 45, 0.3))'
                    : 'linear-gradient(135deg, rgba(31, 41, 55, 0.6), rgba(17, 24, 39, 0.6))',
              borderColor:
                theme === 'gameofthrones'
                  ? 'rgb(120, 53, 15)'
                  : theme === 'christmas'
                    ? 'rgb(220, 38, 38)'
                    : 'rgb(55, 65, 81)',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="text-5xl mb-4"
            >
              🏋️
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">
              No Active Session
            </h2>
            <p className="text-gray-400 mb-6">
              Select or create a session to get started
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSessionSelectorOpen(true)}
              className="text-white font-bold px-8 py-3 rounded-lg inline-flex items-center gap-2 transition-all shadow-lg"
              style={{ backgroundColor: 'rgb(59, 130, 246)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(37, 99, 235)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(59, 130, 246)';
              }}
            >
              <History className="w-5 h-5" />
              Open Sessions
            </motion.button>
          </motion.div>
        </div>
      ) : activeSessionName ? (
        <>
          {/* Countdown Timer */}
          <div className="max-w-7xl mx-auto px-4 mt-4">
            <CountdownTimer key={activeSessionName} theme={theme} />
          </div>

          {/* Stopwatch — plank sessions only */}
          {sessionType === 'plank' && (
            <div className="max-w-7xl mx-auto px-4 mt-4">
              <div className="max-w-sm mx-auto lg:mx-0">
                <StopwatchWidget theme={theme} />
              </div>
            </div>
          )}

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
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Players
                    </h2>
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
        </>
      ) : null}

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
