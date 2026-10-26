'use client';

import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
  duration?: number;
}

/** Counts up/down to `value`. Respects prefers-reduced-motion. */
export default function AnimatedNumber({
  value,
  format = (v) => String(v),
  duration = 0.6,
}: AnimatedNumberProps) {
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
  }, [value, duration]);

  // Intermediate frames of a fractional (e.g. plank) value shouldn't flicker decimals
  const shown = Number.isInteger(value) ? Math.round(display) : display;
  return <>{format(shown)}</>;
}
