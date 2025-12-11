import { Theme } from './emojis';

export interface ThemeColors {
  bg: {
    primary: string;
    secondary: string;
    gradient: string;
  };
  accent: {
    primary: string;
    secondary: string;
    highlight: string;
  };
  button: {
    primary: string;
    primaryHover: string;
    secondary: string;
    secondaryHover: string;
  };
  card: string;
  border: string;
  text: {
    primary: string;
    secondary: string;
  };
}

export const themeColors: Record<Theme, ThemeColors> = {
  cartoon: {
    bg: {
      primary: 'gray-900',
      secondary: 'gray-800',
      gradient: 'from-gray-900 via-gray-800 to-black',
    },
    accent: {
      primary: 'yellow-400',
      secondary: 'orange-500',
      highlight: 'purple-600',
    },
    button: {
      primary: 'from-green-500 to-emerald-600',
      primaryHover: 'from-green-600 to-emerald-700',
      secondary: 'purple-600',
      secondaryHover: 'purple-700',
    },
    card: 'bg-gray-800/40',
    border: 'border-gray-700',
    text: {
      primary: 'text-white',
      secondary: 'text-gray-300',
    },
  },
  christmas: {
    bg: {
      primary: 'red-950',
      secondary: 'red-900',
      gradient: 'from-green-900 via-red-950 to-emerald-900',
    },
    accent: {
      primary: 'yellow-300',
      secondary: 'red-500',
      highlight: 'red-600',
    },
    button: {
      primary: 'from-red-600 to-green-600',
      primaryHover: 'from-red-700 to-green-700',
      secondary: 'green-600',
      secondaryHover: 'green-700',
    },
    card: 'bg-gradient-to-br from-red-900/60 to-green-900/40',
    border: 'border-red-700',
    text: {
      primary: 'text-white',
      secondary: 'text-red-100',
    },
  },
};

export function getThemeClasses(theme: Theme) {
  return themeColors[theme];
}
