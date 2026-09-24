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
  gameofthrones: {
    bg: {
      primary: 'slate-950',
      secondary: 'slate-900',
      gradient: 'from-black via-slate-900 to-stone-950',
    },
    accent: {
      primary: 'amber-500',
      secondary: 'red-700',
      highlight: 'yellow-600',
    },
    button: {
      primary: 'from-amber-600 to-yellow-700',
      primaryHover: 'from-amber-700 to-yellow-800',
      secondary: 'red-800',
      secondaryHover: 'red-900',
    },
    card: 'bg-gradient-to-br from-slate-900/70 to-stone-950/60',
    border: 'border-amber-900',
    text: {
      primary: 'text-amber-50',
      secondary: 'text-stone-300',
    },
  },
  halloween: {
    bg: {
      primary: 'purple-950',
      secondary: 'black',
      gradient: 'from-black via-purple-950 to-orange-950',
    },
    accent: {
      primary: 'orange-500',
      secondary: 'purple-500',
      highlight: 'lime-400',
    },
    button: {
      primary: 'from-orange-600 to-purple-700',
      primaryHover: 'from-orange-700 to-purple-800',
      secondary: 'purple-700',
      secondaryHover: 'purple-800',
    },
    card: 'bg-gradient-to-br from-purple-950/70 to-black/60',
    border: 'border-orange-700',
    text: {
      primary: 'text-orange-50',
      secondary: 'text-purple-300',
    },
  },
};

export function getThemeClasses(theme: Theme) {
  return themeColors[theme];
}

export function getSeasonalTheme(date: Date = new Date()): Theme {
  const month = date.getMonth();
  const day = date.getDate();

  // Halloween: from the last day of September through the end of October.
  if ((month === 8 && day >= 30) || month === 9) {
    return 'halloween';
  }

  // Game of Thrones: November before the final day, and the default year-round outside seasonal windows.
  if (month === 10) {
    return day === 30 ? 'christmas' : 'gameofthrones';
  }

  // Christmas: from the last day of November through the end of December.
  if (month === 11) {
    return 'christmas';
  }

  return 'gameofthrones';
}
