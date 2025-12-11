// Fun fitness-related emojis
export const PLAYER_EMOJIS = [
  '🦾',
  '💪',
  '🏋️',
  '🤸',
  '🧘',
  '🤾',
  '🏃',
  '🚴',
  '⛹️',
  '🤺',
  '🏊',
  '🧗',
];

// Get emoji based on player name (deterministic)
export function getPlayerEmoji(name: string): string {
  const hash = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PLAYER_EMOJIS[hash % PLAYER_EMOJIS.length];
}

// Animation types
export const ANIMATION_TYPES = [
  'bounce',
  'wiggle',
  'spin',
  'pulse',
  'float',
  'shake',
] as const;

export type AnimationType = (typeof ANIMATION_TYPES)[number];

// Get animation type based on player ID (deterministic)
export function getPlayerAnimation(playerId: number): AnimationType {
  return ANIMATION_TYPES[playerId % ANIMATION_TYPES.length];
}
