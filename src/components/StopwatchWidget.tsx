'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Theme } from '@/lib/emojis';

interface StopwatchWidgetProps {
  theme?: Theme;
}

const CIRCLE_RADIUS = 54;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
// One full revolution of the ring = 60 seconds
const RING_PERIOD = 60_000;

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  return {
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
    centiseconds: centiseconds.toString().padStart(2, '0'),
  };
}

function getThemeColors(theme: Theme) {
  switch (theme) {
    case 'christmas':
      return {
        ringTrack: 'rgba(220, 38, 38, 0.15)',
        ringStroke: 'rgb(239, 68, 68)',
        ringGlow: 'rgba(239, 68, 68, 0.4)',
        accent: 'rgb(253, 230, 138)',
        bg: 'linear-gradient(135deg, rgba(127, 29, 29, 0.6), rgba(20, 83, 45, 0.4))',
        border: 'rgb(220, 38, 38)',
        btnStart: 'rgb(34, 197, 94)',
        btnStartHover: 'rgb(22, 163, 74)',
        btnPause: 'rgb(234, 179, 8)',
        btnPauseHover: 'rgb(202, 138, 4)',
        btnReset: 'rgba(239, 68, 68, 0.2)',
        btnResetBorder: 'rgb(239, 68, 68)',
        labelColor: 'rgb(252, 165, 165)',
        timeColor: 'rgb(253, 230, 138)',
        centiColor: 'rgba(253, 230, 138, 0.6)',
        lapBg: 'rgba(20, 83, 45, 0.3)',
      };
    case 'gameofthrones':
      return {
        ringTrack: 'rgba(245, 158, 11, 0.1)',
        ringStroke: 'rgb(245, 158, 11)',
        ringGlow: 'rgba(245, 158, 11, 0.35)',
        accent: 'rgb(245, 158, 11)',
        bg: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(28, 25, 23, 0.6))',
        border: 'rgb(120, 53, 15)',
        btnStart: 'rgb(217, 119, 6)',
        btnStartHover: 'rgb(180, 83, 9)',
        btnPause: 'rgb(234, 179, 8)',
        btnPauseHover: 'rgb(202, 138, 4)',
        btnReset: 'rgba(185, 28, 28, 0.2)',
        btnResetBorder: 'rgb(185, 28, 28)',
        labelColor: 'rgb(180, 160, 130)',
        timeColor: 'rgb(245, 158, 11)',
        centiColor: 'rgba(245, 158, 11, 0.5)',
        lapBg: 'rgba(120, 53, 15, 0.2)',
      };
    default: // cartoon
      return {
        ringTrack: 'rgba(250, 204, 21, 0.1)',
        ringStroke: 'rgb(250, 204, 21)',
        ringGlow: 'rgba(250, 204, 21, 0.3)',
        accent: 'rgb(250, 204, 21)',
        bg: 'linear-gradient(135deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.8))',
        border: 'rgb(55, 65, 81)',
        btnStart: 'rgb(34, 197, 94)',
        btnStartHover: 'rgb(22, 163, 74)',
        btnPause: 'rgb(234, 179, 8)',
        btnPauseHover: 'rgb(202, 138, 4)',
        btnReset: 'rgba(239, 68, 68, 0.15)',
        btnResetBorder: 'rgb(239, 68, 68)',
        labelColor: 'rgb(156, 163, 175)',
        timeColor: 'rgb(250, 204, 21)',
        centiColor: 'rgba(250, 204, 21, 0.5)',
        lapBg: 'rgba(55, 65, 81, 0.4)',
      };
  }
}

export default function StopwatchWidget({
  theme = 'cartoon',
}: StopwatchWidgetProps) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [minimized, setMinimized] = useState(false);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const baseRef = useRef(0);

  const tick = useCallback(() => {
    if (startRef.current !== null) {
      setElapsed(baseRef.current + (performance.now() - startRef.current));
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (running) {
      startRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (startRef.current !== null) {
        baseRef.current += performance.now() - startRef.current;
        startRef.current = null;
      }
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, tick]);

  const handleStartPause = () => setRunning((r) => !r);

  const handleReset = () => {
    setRunning(false);
    setElapsed(0);
    baseRef.current = 0;
    startRef.current = null;
    setLaps([]);
  };

  const handleLap = () => {
    if (running) {
      setLaps((prev) => [elapsed, ...prev]);
    }
  };

  const colors = getThemeColors(theme);
  const time = formatTime(elapsed);

  // Ring progress: one revolution per RING_PERIOD
  const progress = (elapsed % RING_PERIOD) / RING_PERIOD;
  const dashOffset = CIRCLE_CIRCUMFERENCE * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="rounded-xl p-5 shadow-xl border backdrop-blur-md"
      style={{
        background: colors.bg,
        borderColor: colors.border,
      }}
    >
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <motion.span
            animate={running ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-lg"
          >
            ⏱️
          </motion.span>
          <h3
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: colors.labelColor }}
          >
            Plank Stopwatch
          </h3>
        </div>
        <div className="flex-1 flex justify-end">
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setMinimized((m) => !m)}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: colors.labelColor,
            }}
            title={minimized ? 'Expand' : 'Minimize'}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {minimized ? (
                <polyline points="6 15 12 9 18 15" />
              ) : (
                <polyline points="6 9 12 15 18 9" />
              )}
            </svg>
          </motion.button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {minimized ? (
          /* Minimized compact view */
          <motion.div
            key="minimized"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-center gap-4">
              {/* Compact time */}
              <div className="flex items-baseline gap-0.5">
                <span
                  className="text-2xl font-mono font-bold tabular-nums"
                  style={{ color: colors.timeColor }}
                >
                  {time.minutes}
                </span>
                <motion.span
                  animate={running ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-xl font-mono font-bold"
                  style={{ color: colors.timeColor }}
                >
                  :
                </motion.span>
                <span
                  className="text-2xl font-mono font-bold tabular-nums"
                  style={{ color: colors.timeColor }}
                >
                  {time.seconds}
                </span>
                <span
                  className="text-sm font-mono tabular-nums ml-0.5"
                  style={{ color: colors.centiColor }}
                >
                  .{time.centiseconds}
                </span>
              </div>

              {/* Compact controls */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleReset}
                  disabled={elapsed === 0}
                  className="w-8 h-8 rounded-full flex items-center justify-center border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: colors.btnReset,
                    borderColor: colors.btnResetBorder,
                  }}
                  title="Reset"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={colors.btnResetBorder}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12a9 9 0 1 1 3 6.73" />
                    <path d="M3 21v-6h6" />
                  </svg>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleStartPause}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all"
                  style={{
                    backgroundColor: running
                      ? colors.btnPause
                      : colors.btnStart,
                    boxShadow: running
                      ? `0 0 16px ${colors.btnPause}40`
                      : `0 0 16px ${colors.btnStart}40`,
                  }}
                  title={running ? 'Pause' : 'Start'}
                >
                  {running ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <polygon points="6,3 20,12 6,21" />
                    </svg>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Full expanded view */
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Ring + Time Display */}
            <div className="flex flex-col items-center">
              <div className="relative w-44 h-44 sm:w-52 sm:h-52">
                {/* SVG Ring */}
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90"
                  viewBox="0 0 120 120"
                >
                  {/* Track */}
                  <circle
                    cx="60"
                    cy="60"
                    r={CIRCLE_RADIUS}
                    fill="none"
                    stroke={colors.ringTrack}
                    strokeWidth="5"
                  />
                  {/* Progress */}
                  <motion.circle
                    cx="60"
                    cy="60"
                    r={CIRCLE_RADIUS}
                    fill="none"
                    stroke={colors.ringStroke}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={CIRCLE_CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    style={{
                      filter: running
                        ? `drop-shadow(0 0 6px ${colors.ringGlow})`
                        : 'none',
                      transition: 'filter 0.3s ease',
                    }}
                  />
                </svg>

                {/* Time text in center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-5">
                  <div className="flex items-baseline gap-0.5">
                    <span
                      className="text-3xl sm:text-4xl font-mono font-bold tabular-nums"
                      style={{ color: colors.timeColor }}
                    >
                      {time.minutes}
                    </span>
                    <motion.span
                      animate={
                        running ? { opacity: [1, 0.3, 1] } : { opacity: 1 }
                      }
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="text-2xl sm:text-3xl font-mono font-bold"
                      style={{ color: colors.timeColor }}
                    >
                      :
                    </motion.span>
                    <span
                      className="text-3xl sm:text-4xl font-mono font-bold tabular-nums"
                      style={{ color: colors.timeColor }}
                    >
                      {time.seconds}
                    </span>
                    <span
                      className="text-base sm:text-lg font-mono tabular-nums ml-0.5"
                      style={{ color: colors.centiColor }}
                    >
                      .{time.centiseconds}
                    </span>
                  </div>
                  {elapsed > 0 && !running && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs mt-1 font-medium"
                      style={{ color: colors.labelColor }}
                    >
                      Paused
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 mt-4">
                {/* Reset */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleReset}
                  disabled={elapsed === 0}
                  className="w-10 h-10 rounded-full flex items-center justify-center border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: colors.btnReset,
                    borderColor: colors.btnResetBorder,
                  }}
                  title="Reset"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={colors.btnResetBorder}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12a9 9 0 1 1 3 6.73" />
                    <path d="M3 21v-6h6" />
                  </svg>
                </motion.button>

                {/* Start / Pause */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleStartPause}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all"
                  style={{
                    backgroundColor: running
                      ? colors.btnPause
                      : colors.btnStart,
                    boxShadow: running
                      ? `0 0 20px ${colors.btnPause}40`
                      : `0 0 20px ${colors.btnStart}40`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = running
                      ? colors.btnPauseHover
                      : colors.btnStartHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = running
                      ? colors.btnPause
                      : colors.btnStart;
                  }}
                  title={running ? 'Pause' : 'Start'}
                >
                  {running ? (
                    // Pause icon
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    // Play icon
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <polygon points="6,3 20,12 6,21" />
                    </svg>
                  )}
                </motion.button>

                {/* Lap */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLap}
                  disabled={!running}
                  className="w-10 h-10 rounded-full flex items-center justify-center border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderColor: colors.accent,
                  }}
                  title="Lap"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={colors.accent}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Lap Times */}
            <AnimatePresence>
              {laps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <div
                    className="rounded-lg p-3 max-h-32 overflow-y-auto space-y-1"
                    style={{ backgroundColor: colors.lapBg }}
                  >
                    {laps.map((lap, i) => {
                      const t = formatTime(lap);
                      const diff =
                        i < laps.length - 1
                          ? formatTime(lap - laps[i + 1])
                          : formatTime(lap);
                      return (
                        <motion.div
                          key={`${i}-${lap}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between text-xs font-mono"
                        >
                          <span style={{ color: colors.labelColor }}>
                            Lap {laps.length - i}
                          </span>
                          <span style={{ color: colors.accent }}>
                            +{diff.minutes}:{diff.seconds}.{diff.centiseconds}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {t.minutes}:{t.seconds}.{t.centiseconds}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
