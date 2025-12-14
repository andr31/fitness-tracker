'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Theme } from '@/lib/emojis';

interface EncouragementAnimationProps {
  show: boolean;
  theme?: Theme;
}

const encouragementMessages = [
  "Amazing! Keep going! 💪",
  "You're crushing it! 🔥",
  "Legendary effort! ⭐",
  "Unstoppable! 🚀",
  "Beast mode activated! 💥",
  "Fantastic work! ✨",
  "You're on fire! 🌟",
  "Incredible! Keep pushing! 💫",
  "Awesome job! 🎯",
  "Way to go! 🎉"
];

export default function EncouragementAnimation({
  show,
  theme = 'cartoon',
}: EncouragementAnimationProps) {
  const message = useMemo(
    () => encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)],
    [show]
  );

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: -20 }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: [0.8, 1.1, 1] }}
        transition={{ duration: 0.5 }}
        className="text-center px-6 py-4 rounded-xl shadow-2xl"
        style={{
          background:
            theme === 'christmas'
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(16, 185, 129, 0.95))'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.95))',
          backdropFilter: 'blur(10px)',
        }}
      >
        <motion.div
          className="text-2xl font-bold text-white mb-1"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.5, repeat: 2 }}
        >
          {message}
        </motion.div>
      </motion.div>

      {/* Floating stars/sparkles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 1,
            scale: 0,
            x: 0,
            y: 0,
          }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0, 1.5, 0.8],
            x: [0, (Math.random() - 0.5) * 200],
            y: [0, -100 - Math.random() * 50],
            rotate: [0, Math.random() * 360],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.1,
            ease: 'easeOut',
          }}
          className="absolute text-2xl"
          style={{
            left: '50%',
            top: '50%',
          }}
        >
          {i % 3 === 0 ? '⭐' : i % 3 === 1 ? '✨' : '💫'}
        </motion.div>
      ))}
    </motion.div>
  );
}
