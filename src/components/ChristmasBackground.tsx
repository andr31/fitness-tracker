'use client';

import { motion } from 'framer-motion';

const Snowflake = ({
  delay,
  duration,
  left,
  size,
}: {
  delay: number;
  duration: number;
  left: string;
  size: number;
}) => {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: '100vh', opacity: [0, 1, 0.5] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
      className="fixed pointer-events-none"
      style={{ left, top: -20 }}
    >
      <div style={{ fontSize: `${size}px` }}>❄️</div>
    </motion.div>
  );
};

const ChristmasLight = ({ delay, color }: { delay: number; color: string }) => {
  return (
    <motion.div
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{
        duration: 1.5,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="w-4 h-4 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
};

export default function ChristmasBackground() {
  const snowflakes = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 10,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 20 + 10,
  }));

  const lights = [
    '#FF0000',
    '#00FF00',
    '#FFD700',
    '#FF69B4',
    '#00CED1',
    '#FF4500',
  ];

  return (
    <>
      {/* Snowflakes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {snowflakes.map((snowflake) => (
          <Snowflake
            key={snowflake.id}
            delay={snowflake.delay}
            duration={snowflake.duration}
            left={snowflake.left}
            size={snowflake.size}
          />
        ))}
      </div>

      {/* Christmas Lights String */}
      <div className="fixed top-10 left-0 right-0 pointer-events-none flex justify-around px-4 z-20">
        {lights.map((color, i) => (
          <ChristmasLight key={i} color={color} delay={i * 0.2} />
        ))}
      </div>
    </>
  );
}
