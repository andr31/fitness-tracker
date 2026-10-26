type HapticKind = 'tap' | 'success' | 'error';

const PATTERNS: Record<HapticKind, number | number[]> = {
  tap: 10,
  success: [15, 40, 15],
  error: [40, 60, 40],
};

export function haptic(kind: HapticKind = 'tap') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  navigator.vibrate(PATTERNS[kind]);
}
