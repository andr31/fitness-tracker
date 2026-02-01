'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function BattleBackground() {
  const [mounted, setMounted] = useState(false);

  // Only generate random positions after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Generate battle elements (swords, shields, banners)
  const battleElements = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    type: i % 3 === 0 ? 'sword' : i % 3 === 1 ? 'banner' : 'flame',
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: 8 + Math.random() * 6,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Animated battle silhouettes */}
      {battleElements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute"
          style={{
            left: element.left,
            bottom: '-10%',
          }}
          initial={{ y: 0, opacity: 0, rotate: 0 }}
          animate={{
            y: [0, -1200],
            opacity: [0, 0.3, 0.4, 0.3, 0],
            rotate: element.type === 'sword' ? [0, 360] : [0, 0],
          }}
          transition={{
            duration: element.duration,
            delay: element.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {element.type === 'sword' && (
            <div className="text-4xl" style={{ filter: 'blur(1px)' }}>
              ⚔️
            </div>
          )}
          {element.type === 'banner' && (
            <div className="text-3xl" style={{ filter: 'blur(1px)' }}>
              🚩
            </div>
          )}
          {element.type === 'flame' && (
            <div className="text-3xl" style={{ filter: 'blur(1px)' }}>
              🔥
            </div>
          )}
        </motion.div>
      ))}

      {/* Animated warrior silhouettes */}
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={`warrior-${i}`}
          className="absolute bottom-0"
          style={{
            left: `${10 + i * 12}%`,
          }}
          initial={{ x: 0, opacity: 0 }}
          animate={{
            x: i % 2 === 0 ? [0, 30, 0] : [0, -30, 0],
            opacity: [0, 0.15, 0.15, 0],
          }}
          transition={{
            duration: 4 + (i % 3),
            delay: i * 0.8,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        >
          <div
            className="text-6xl"
            style={{
              filter: 'blur(2px)',
              color: 'rgba(245, 158, 11, 0.3)',
            }}
          >
            🗡️
          </div>
        </motion.div>
      ))}

      {/* Floating castle banners */}
      {Array.from({ length: 5 }, (_, i) => (
        <motion.div
          key={`castle-${i}`}
          className="absolute top-0"
          style={{
            left: `${15 + i * 20}%`,
          }}
          animate={{
            y: [0, 20, 0],
            rotate: [-5, 5, -5],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div
            className="text-5xl"
            style={{
              filter: 'blur(1.5px)',
              opacity: 0.2,
              color: 'rgb(180, 83, 9)',
            }}
          >
            🏰
          </div>
        </motion.div>
      ))}

      {/* Floating crowns */}
      {Array.from({ length: 3 }, (_, i) => (
        <motion.div
          key={`crown-${i}`}
          className="absolute"
          style={{
            left: `${25 + i * 30}%`,
            top: `${20 + i * 15}%`,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 10, -10, 0],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div
            className="text-4xl"
            style={{
              filter: 'blur(1px)',
              color: 'rgb(245, 158, 11)',
            }}
          >
            👑
          </div>
        </motion.div>
      ))}

      {/* Dragon shadows */}
      {Array.from({ length: 2 }, (_, i) => (
        <motion.div
          key={`dragon-${i}`}
          className="absolute top-10"
          style={{
            left: i === 0 ? '-10%' : '110%',
          }}
          initial={{ x: 0, opacity: 0 }}
          animate={{
            x: i === 0 ? [0, 1600] : [-1600, 0],
            opacity: [0, 0.2, 0.3, 0.2, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            delay: i * 7.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <div
            className="text-7xl"
            style={{
              filter: 'blur(2px)',
              color: 'rgba(185, 28, 28, 0.4)',
            }}
          >
            🐉
          </div>
        </motion.div>
      ))}

      {/* Ambient glow effect */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.03) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
