'use client';

import { motion } from 'framer-motion';
import { AnimationType } from '@/lib/emojis';

interface AnimatedIconProps {
  emoji: string;
  animationType: AnimationType;
  size?: 'small' | 'medium' | 'large';
}

const sizeMap = {
  small: 'text-2xl',
  medium: 'text-4xl',
  large: 'text-6xl',
};

const animationVariants = {
  bounce: {
    y: [0, -30, 0],
    transition: {
      duration: 1.2,
      repeat: Infinity as number,
      ease: 'easeInOut' as const,
    },
  },
  wiggle: {
    rotate: [-10, 10, -10, 10, -10],
    scale: [1, 1.1, 1, 1.1, 1],
    transition: {
      duration: 1,
      repeat: Infinity as number,
      ease: 'easeInOut' as const,
    },
  },
  spin: {
    rotate: [0, 360],
    scale: [1, 1.2, 1],
    transition: {
      duration: 3,
      repeat: Infinity as number,
      ease: 'linear' as const,
    },
  },
  pulse: {
    scale: [1, 1.3, 0.95, 1.2, 1],
    transition: {
      duration: 1.6,
      repeat: Infinity as number,
      ease: 'easeInOut' as const,
    },
  },
  float: {
    y: [0, -20, 0],
    x: [0, 15, -10, 0],
    rotate: [0, 10, -10, 0],
    transition: {
      duration: 4,
      repeat: Infinity as number,
      ease: 'easeInOut' as const,
    },
  },
  shake: {
    x: [-5, 5, -5, 5, -5, 0],
    rotate: [-5, 5, -5, 5, -5, 0],
    transition: {
      duration: 0.8,
      repeat: Infinity as number,
      ease: 'easeInOut' as const,
    },
  },
};

export default function AnimatedIcon({
  emoji,
  animationType,
  size = 'medium',
}: AnimatedIconProps) {
  return (
    <motion.div
      className={`${sizeMap[size]} inline-block`}
      animate={animationVariants[animationType]}
    >
      {emoji}
    </motion.div>
  );
}
