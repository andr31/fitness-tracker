'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, motion, useAnimate } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
  duration?: number;
  /** Scale pulse on change (1 disables) */
  pulse?: number;
  /** Briefly tint the number on change */
  flashColor?: string;
}

/** Counts up/down to `value`. Respects prefers-reduced-motion. */
export default function AnimatedNumber({
  value,
  format = (v) => String(v),
  duration = 0.6,
  pulse = 1.2,
  flashColor,
}: AnimatedNumberProps) {
  const [scope, animatePulse] = useAnimate<HTMLSpanElement>();
  const [display, setDisplay] = useState(value);
  const current = useRef(value);

  useEffect(() => {
    const reduce = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduce || current.current === value) {
      current.current = value;
      setDisplay(value);
      return;
    }
    if (pulse !== 1 || flashColor) {
      animatePulse(
        scope.current,
        {
          scale: [pulse, 1],
          ...(flashColor ? { color: [flashColor, '#FFFFFF'] } : {}),
        },
        { duration: 0.4 },
      );
    }
    const controls = animate(current.current, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => {
        current.current = v;
        setDisplay(v);
      },
      onComplete: () => {
        current.current = value;
        setDisplay(value);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  // Intermediate frames of a fractional (e.g. plank) value shouldn't flicker decimals
  const shown = Number.isInteger(value) ? Math.round(display) : display;
  return (
    <motion.span ref={scope} style={{ display: 'inline-block' }}>
      {format(shown)}
    </motion.span>
  );
}
