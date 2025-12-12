'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Theme } from '@/lib/emojis';

interface FloatingAIBalloonProps {
  message: string;
  type: 'commentator' | 'coach';
  isVisible: boolean;
  theme?: Theme;
}

export default function FloatingAIBalloon({
  message,
  type,
  isVisible,
  theme = 'christmas',
}: FloatingAIBalloonProps) {
  const icon = type === 'commentator' ? '🎙️' : '🤖';
  const title = type === 'commentator' ? 'Live Commentary' : 'AI Coach';

  return (
    <AnimatePresence>
      {isVisible && message && (
        <motion.div
          initial={{ opacity: 0, y: 100, x: 100 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            x: 0,
          }}
          exit={{ opacity: 0, y: 100, x: 100 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="fixed bottom-6 right-6 z-50 max-w-md"
        >
          <motion.div
            className="rounded-3xl p-5 shadow-2xl backdrop-blur-md"
            style={{
              background:
                theme === 'christmas'
                  ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(34, 197, 94, 0.95))'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(147, 51, 234, 0.95))',
            }}
            animate={{
              y: [0, -10, 0],
              rotate: [0, 1, -1, 0],
            }}
            transition={{
              y: {
                repeat: Infinity,
                duration: 3,
                ease: 'easeInOut',
              },
              rotate: {
                repeat: Infinity,
                duration: 4,
                ease: 'easeInOut',
              },
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <motion.span
                animate={
                  type === 'commentator'
                    ? { rotate: [0, 360] }
                    : { scale: [1, 1.2, 1] }
                }
                transition={
                  type === 'commentator'
                    ? { repeat: Infinity, duration: 2, ease: 'linear' }
                    : { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
                }
                className="text-3xl"
              >
                {icon}
              </motion.span>
              <span className="text-white font-bold text-sm uppercase tracking-wide opacity-90">
                {title}
              </span>
            </div>

            {/* Message */}
            <motion.p
              key={message}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-white font-semibold text-lg leading-snug mb-3"
              style={{
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            >
              {message}
            </motion.p>

            {/* Powered by AI badge */}
            <div className="flex items-center gap-1.5 opacity-70">
              <span className="text-sm">⚡</span>
              <span className="text-white text-xs font-medium uppercase tracking-wider">
                Powered by AI
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
