// Theme emoji sets
export const THEMES = {
  cartoon: [
    '🤖',
    '👽',
    '🤡',
    '🦸',
    '🧙',
    '🧚',
    '🧛',
    '🤠',
    '🥸',
    '😸',
    '😹',
    '😺',
    '😻',
    '😼',
    '😽',
    '😾',
    '😿',
    '🙀',
    '👾',
    '🎃',
    '👹',
    '👺',
  ],
  christmas: [
    '🎅',
    '🤶',
    '🎄',
    '⛄',
    '🎁',
    '🔔',
    '❄️',
    '⛸️',
    '🦌',
    '🕯️',
    '🍪',
    '🥛',
    '🍷',
    '🎿',
    '⛷️',
    '🧥',
    '🧤',
    '🧣',
    '👢',
    '🎊',
    '🎉',
    '✨',
  ],
  gameofthrones: [
    '🐺', // Stark (Direwolf)
    '🦁', // Lannister (Lion)
    '🐉', // Targaryen (Dragon)
    '🐙', // Greyjoy (Kraken)
    '🌹', // Tyrell (Rose)
    '🦅', // Arryn (Falcon)
    '⚔️', // Swords
    '🛡️', // Shield
    '👑', // Crown
    '🏰', // Castle
    '🗡️', // Dagger
    '🔥', // Fire (Dracarys)
    '❄️', // Ice/Winter
    '🦌', // Baratheon (Stag)
    '☠️', // Death/Danger
    '🐍', // Viper/Martell
    '🦂', // Scorpion
    '🪓', // Axe
    '⚡', // Lightning
    '🌙', // Moon
    '⭐', // Star
    '🍷', // Wine
  ],
  halloween: [
    '🎃',
    '👻',
    '🦇',
    '🕷️',
    '🕸️',
    '💀',
    '☠️',
    '🧟',
    '🧛',
    '🧙',
    '🙀',
    '🪦',
    '⚰️',
    '🌙',
    '🔮',
    '🐈‍⬛',
    '🦴',
    '🍬',
    '🧹',
    '⚡',
    '🩸',
    '👹',
  ],
} as const;

export type Theme = keyof typeof THEMES;

// Get emoji based on player name and theme (deterministic)
export function getPlayerEmoji(name: string, theme: Theme = 'cartoon'): string {
  const emojis = THEMES[theme];
  const hash = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return emojis[hash % emojis.length];
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
