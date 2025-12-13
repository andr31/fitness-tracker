'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationEffectProps {
  isActive: boolean;
  playerName?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  type: 'confetti' | 'star' | 'heart' | 'circle';
}

interface Firework {
  id: number;
  x: number;
  y: number;
  particles: {
    id: number;
    angle: number;
    speed: number;
    color: string;
  }[];
}

export default function CelebrationEffect({ isActive, playerName }: CelebrationEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [fireworks, setFireworks] = useState<Firework[]>([]);
  const [opacity, setOpacity] = useState(1);
  const [showMessage, setShowMessage] = useState(true);

  const createParticle = useCallback((id: number, x: number, y: number): Particle => {
    const colors = ['#FFD700', '#FF69B4', '#00FF00', '#00BFFF', '#FF4500', '#9370DB', '#FFFF00', '#FF1493'];
    const types: Particle['type'][] = ['confetti', 'star', 'heart', 'circle'];
    
    return {
      id,
      x,
      y,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 12 + 6,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 2 + 3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      type: types[Math.floor(Math.random() * types.length)],
    };
  }, []);

  const getParticleShape = (type: Particle['type']) => {
    switch (type) {
      case 'star':
        return '⭐';
      case 'heart':
        return '❤️';
      case 'circle':
        return '🎉';
      default:
        return '▪️';
    }
  };

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      setFireworks([]);
      setOpacity(1);
      setShowMessage(true);
      return;
    }

    // Generate initial confetti burst
    const initialParticles: Particle[] = [];
    for (let i = 0; i < 150; i++) {
      initialParticles.push(createParticle(i, Math.random() * window.innerWidth, -50));
    }
    setParticles(initialParticles);

    // Add more confetti periodically
    const confettiInterval = setInterval(() => {
      setParticles(prev => {
        const newParticles = [...prev];
        for (let i = 0; i < 20; i++) {
          newParticles.push(createParticle(Date.now() + i, Math.random() * window.innerWidth, -50));
        }
        return newParticles.slice(-200); // Keep only last 200
      });
    }, 300);

    // Create fireworks periodically
    const fireworkInterval = setInterval(() => {
      const newFirework: Firework = {
        id: Date.now(),
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 0.5 + 100,
        particles: Array.from({ length: 30 }, (_, i) => ({
          id: i,
          angle: (Math.PI * 2 * i) / 30,
          speed: Math.random() * 3 + 2,
          color: ['#FFD700', '#FF69B4', '#00FF00', '#00BFFF', '#FF4500', '#9370DB'][Math.floor(Math.random() * 6)],
        })),
      };
      setFireworks(prev => [...prev, newFirework]);

      // Remove firework after animation
      setTimeout(() => {
        setFireworks(prev => prev.filter(f => f.id !== newFirework.id));
      }, 1000);
    }, 600);

    // Hide message after 3 seconds
    const messageTimeout = setTimeout(() => {
      setShowMessage(false);
    }, 3000);

    // Start fading after 90 seconds
    const fadeTimeout = setTimeout(() => {
      let currentOpacity = 1;
      const fadeInterval = setInterval(() => {
        currentOpacity -= 0.02;
        if (currentOpacity <= 0) {
          clearInterval(fadeInterval);
          setOpacity(0);
        } else {
          setOpacity(currentOpacity);
        }
      }, 100);
    }, 90000); // Start fading at 90 seconds

    return () => {
      clearInterval(confettiInterval);
      clearInterval(fireworkInterval);
      clearTimeout(messageTimeout);
      clearTimeout(fadeTimeout);
    };
  }, [isActive, createParticle]);

  // Generate deterministic values for floating emojis
  const floatingEmojis = useMemo(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1000;
    return [...Array(10)].map((_, i) => ({
      id: i,
      initialX: (i * 123 + 456) % width, // Deterministic based on index
      duration: 4 + (i % 3),
      delay: (i * 0.3) % 2,
      repeatDelay: 1 + (i % 3),
      emoji: ['🎊', '🎈', '🏆', '💪', '⚡', '🌟', '✨', '🔥'][i % 8],
    }));
  }, []);

  if (!isActive) return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[100]" 
      style={{ opacity }}
    >
      {/* Congratulations Message */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101]"
          >
            <div className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 text-white px-12 py-8 rounded-3xl shadow-2xl text-center border-4 border-white">
              <motion.div
                animate={{ rotate: [0, -5, 5, -5, 5, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                <div className="text-6xl font-bold mb-2">🎉 MILESTONE! 🎉</div>
                <div className="text-3xl font-semibold">
                  {playerName} reached the goal!
                </div>
                <div className="text-2xl mt-2 opacity-90">
                  🏆 Amazing Achievement! 🏆
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti Particles */}
      {particles.map((particle) => {
        const duration = 3 + (particle.id % 30) / 10; // Deterministic based on id
        return (
          <motion.div
            key={particle.id}
            initial={{ x: particle.x, y: particle.y, opacity: 1 }}
            animate={{
              x: particle.x + particle.vx * 50,
              y: typeof window !== 'undefined' ? window.innerHeight + 100 : 1000,
              rotate: particle.rotation + particle.rotationSpeed * 20,
              opacity: [1, 1, 0.8, 0],
            }}
            transition={{
              duration,
              ease: 'linear',
            }}
            className="absolute"
            style={{
              fontSize: particle.size,
              color: particle.color,
            }}
          >
            {getParticleShape(particle.type)}
          </motion.div>
        );
      })}

      {/* Fireworks */}
      {fireworks.map((firework) => (
        <div key={firework.id} className="absolute" style={{ left: firework.x, top: firework.y }}>
          {/* Launch trail */}
          <motion.div
            initial={{ scaleY: 0, opacity: 1 }}
            animate={{ scaleY: 1, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute w-1 h-20 bg-yellow-300 origin-bottom"
            style={{ left: -0.5, top: 0 }}
          />
          
          {/* Explosion particles */}
          {firework.particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos(p.angle) * p.speed * 50,
                y: Math.sin(p.angle) * p.speed * 50,
                opacity: 0,
                scale: 0,
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
          ))}
          
          {/* Center flash */}
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute w-8 h-8 rounded-full -left-4 -top-4"
            style={{ backgroundColor: firework.particles[0].color }}
          />
        </div>
      ))}

      {/* Additional floating emojis */}
      {floatingEmojis.map((emoji) => (
        <motion.div
          key={`emoji-${emoji.id}`}
          initial={{ 
            x: emoji.initialX, 
            y: typeof window !== 'undefined' ? window.innerHeight + 50 : 1000,
            scale: 0,
            rotate: 0 
          }}
          animate={{
            y: -100,
            scale: [0, 1.5, 1],
            rotate: 360,
          }}
          transition={{
            duration: emoji.duration,
            delay: emoji.delay,
            repeat: Infinity,
            repeatDelay: emoji.repeatDelay,
          }}
          className="absolute text-4xl"
        >
          {emoji.emoji}
        </motion.div>
      ))}
    </div>
  );
}
