'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const Bat = ({
  delay,
  duration,
  top,
  size,
  reverse,
}: {
  delay: number;
  duration: number;
  top: string;
  size: number;
  reverse: boolean;
}) => {
  return (
    <motion.div
      initial={{ x: reverse ? '110vw' : '-10vw', opacity: 0 }}
      animate={{
        x: reverse ? '-10vw' : '110vw',
        y: [0, -30, 0, 30, 0],
        opacity: [0, 1, 1, 1, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
      className="fixed pointer-events-none"
      style={{ top, fontSize: `${size}px`, scaleX: reverse ? -1 : 1 }}
    >
      🦇
    </motion.div>
  );
};

const Ghost = ({
  delay,
  left,
  size,
}: {
  delay: number;
  left: string;
  size: number;
}) => {
  return (
    <motion.div
      initial={{ y: '110vh', opacity: 0 }}
      animate={{
        y: '-20vh',
        x: [0, 40, -40, 0],
        opacity: [0, 0.7, 0.7, 0],
      }}
      transition={{
        duration: 14,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="fixed pointer-events-none"
      style={{ left, fontSize: `${size}px`, filter: 'blur(0.5px)' }}
    >
      👻
    </motion.div>
  );
};

const Spider = ({ left, delay }: { left: string; delay: number }) => {
  return (
    <div className="fixed top-0 pointer-events-none" style={{ left }}>
      <motion.div
        className="mx-auto"
        style={{
          width: '1px',
          background:
            'linear-gradient(to bottom, rgba(200,200,200,0.5), rgba(200,200,200,0.1))',
        }}
        initial={{ height: 0 }}
        animate={{ height: [0, 140, 140, 0] }}
        transition={{
          duration: 6,
          delay,
          repeat: Infinity,
          repeatDelay: 4,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: [0, 140, 140, 0], opacity: [0, 1, 1, 0] }}
        transition={{
          duration: 6,
          delay,
          repeat: Infinity,
          repeatDelay: 4,
          ease: 'easeInOut',
        }}
        className="text-2xl"
      >
        🕷️
      </motion.div>
    </div>
  );
};

export default function HalloweenBackground() {
  const [mounted, setMounted] = useState(false);
  const [bats, setBats] = useState<
    Array<{ id: number; delay: number; duration: number; top: string; size: number; reverse: boolean }>
  >([]);
  const [ghosts, setGhosts] = useState<
    Array<{ id: number; delay: number; left: string; size: number }>
  >([]);
  const [spiders, setSpiders] = useState<Array<{ id: number; left: string; delay: number }>>([]);

  useEffect(() => {
    setMounted(true);
    setBats(
      Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        delay: Math.random() * 8,
        duration: 10 + Math.random() * 8,
        top: `${5 + Math.random() * 50}%`,
        size: 20 + Math.random() * 20,
        reverse: i % 2 === 0,
      })),
    );
    setGhosts(
      Array.from({ length: 4 }).map((_, i) => ({
        id: i,
        delay: i * 3.5,
        left: `${10 + Math.random() * 80}%`,
        size: 40 + Math.random() * 30,
      })),
    );
    setSpiders(
      Array.from({ length: 3 }).map((_, i) => ({
        id: i,
        left: `${15 + i * 30}%`,
        delay: i * 2,
      })),
    );
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Rolling fog */}
      <div className="fixed inset-x-0 bottom-0 h-1/3 pointer-events-none overflow-hidden z-0">
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(88, 28, 135, 0.35), transparent)',
          }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -inset-x-1/4 bottom-0 h-40"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(200,200,220,0.15), transparent 70%)',
          }}
          animate={{ x: ['-10%', '10%', '-10%'] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Flickering purple/orange ambient glow (lightning-ish) */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle at 20% 10%, rgba(168, 85, 247, 0.12), transparent 60%)',
        }}
        animate={{ opacity: [0.4, 0.9, 0.3, 0.8, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Bats */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
        {bats.map((bat) => (
          <Bat key={bat.id} {...bat} />
        ))}
      </div>

      {/* Ghosts */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
        {ghosts.map((ghost) => (
          <Ghost key={ghost.id} delay={ghost.delay} left={ghost.left} size={ghost.size} />
        ))}
      </div>

      {/* Spiders lowering from webs */}
      <div className="z-20">
        {spiders.map((spider) => (
          <Spider key={spider.id} left={spider.left} delay={spider.delay} />
        ))}
      </div>

      {/* Corner spiderwebs */}
      <div className="fixed top-0 left-0 pointer-events-none text-7xl opacity-30 z-10 -translate-x-4 -translate-y-4">
        🕸️
      </div>
      <div className="fixed top-0 right-0 pointer-events-none text-7xl opacity-30 z-10 translate-x-4 -translate-y-4 -scale-x-100">
        🕸️
      </div>

      {/* Glowing jack-o-lanterns along the bottom */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none flex justify-around px-4 z-10">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="text-4xl"
            style={{ filter: 'drop-shadow(0 0 10px rgba(249, 115, 22, 0.7))' }}
            animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.05, 1] }}
            transition={{
              duration: 2 + (i % 3) * 0.4,
              delay: i * 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            🎃
          </motion.div>
        ))}
      </div>
    </>
  );
}
