/**
 * Card Design Themes Configuration
 *
 * All visual theme options for playing cards in Spar.
 * Default theme: Afro-Heritage
 *
 * Each theme defines:
 * - Background colors (gradients)
 * - Pattern colors (Kente-inspired overlays)
 * - Border colors
 * - Suit symbol colors
 * - Glow/shadow effects
 * - Animation parameters
 */

export interface CardTheme {
  id: string;
  name: string;
  displayName: string;
  description: string;
  emoji: string;
  isDefault?: boolean;
  colors: {
    // Background gradient stops
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      quaternary: string;
    };
    // Kente pattern overlay colors (with alpha)
    patterns: {
      stripe1: string;
      stripe2: string;
      stripe3: string;
      stripe4: string;
    };
    // Border and accent colors
    border: {
      primary: string;
      secondary: string;
      decorative: string;
    };
    // Suit symbol colors
    suits: {
      hearts: string;
      diamonds: string;
      clubs: string;
      spades: string;
    };
    // Text colors
    text: {
      primary: string;
      secondary: string;
      shadow: string;
    };
    // Effect colors
    effects: {
      glow: string;
      shadow: string;
      hover: string;
    };
  };
  // Animation parameters
  animations: {
    hoverGlow: {
      color: string;
      intensity: number;
      spread: number;
    };
    pulseSpeed: number; // seconds
  };
}

export const cardThemes: Record<string, CardTheme> = {
  'afro-heritage': {
    id: 'afro-heritage',
    name: 'afro-heritage',
    displayName: 'Afro-Heritage',
    description: 'Warm cream backgrounds with Kente cloth patterns and gold accents',
    emoji: '⭐',
    isDefault: true,
    colors: {
      background: {
        primary: '#FFF5E6',
        secondary: '#FFE8D6',
        tertiary: '#FFF9F0',
        quaternary: '#FFF5E6',
      },
      patterns: {
        stripe1: 'rgba(251, 192, 45, 0.15)',
        stripe2: 'rgba(139, 69, 19, 0.12)',
        stripe3: 'rgba(255, 215, 0, 0.10)',
        stripe4: 'rgba(160, 82, 45, 0.08)',
      },
      border: {
        primary: '#FFD700',
        secondary: '#D4AF37',
        decorative: '#B8860B',
      },
      suits: {
        hearts: '#FF4500',
        diamonds: '#FF4500',
        clubs: '#2F4F2F',
        spades: '#1C1C1C',
      },
      text: {
        primary: '#1C1C1C',
        secondary: '#4A4A4A',
        shadow: 'rgba(0, 0, 0, 0.3)',
      },
      effects: {
        glow: '#FFD700',
        shadow: 'rgba(212, 175, 55, 0.5)',
        hover: '#FFC700',
      },
    },
    animations: {
      hoverGlow: {
        color: '#FFD700',
        intensity: 20,
        spread: 10,
      },
      pulseSpeed: 2,
    },
  },

  'neon-arcade': {
    id: 'neon-arcade',
    name: 'neon-arcade',
    displayName: 'Neon Arcade',
    description: 'Bright white backgrounds with electric neon accents',
    emoji: '⚡',
    colors: {
      background: {
        primary: '#FFFFFF',
        secondary: '#FFF5FF',
        tertiary: '#FFFAFF',
        quaternary: '#FFFFFF',
      },
      patterns: {
        stripe1: 'rgba(0, 255, 255, 0.12)',
        stripe2: 'rgba(255, 0, 255, 0.10)',
        stripe3: 'rgba(204, 255, 0, 0.08)',
        stripe4: 'rgba(255, 215, 0, 0.08)',
      },
      border: {
        primary: '#00FFFF',
        secondary: '#FF00FF',
        decorative: '#CCFF00',
      },
      suits: {
        hearts: '#FF4500',
        diamonds: '#FF00FF',
        clubs: '#00FFFF',
        spades: '#8B00FF',
      },
      text: {
        primary: '#FF4500',
        secondary: '#FF00FF',
        shadow: 'rgba(0, 255, 255, 0.5)',
      },
      effects: {
        glow: '#00FFFF',
        shadow: 'rgba(255, 0, 255, 0.5)',
        hover: '#CCFF00',
      },
    },
    animations: {
      hoverGlow: {
        color: '#00FFFF',
        intensity: 30,
        spread: 15,
      },
      pulseSpeed: 1.5,
    },
  },

  'sunset-fire': {
    id: 'sunset-fire',
    name: 'sunset-fire',
    displayName: 'Sunset Fire',
    description: 'Warm peach and coral backgrounds with fire-inspired gradients',
    emoji: '🌅',
    colors: {
      background: {
        primary: '#FFE5CC',
        secondary: '#FFD4B3',
        tertiary: '#FFF0E6',
        quaternary: '#FFE5CC',
      },
      patterns: {
        stripe1: 'rgba(255, 102, 0, 0.15)',
        stripe2: 'rgba(255, 69, 0, 0.12)',
        stripe3: 'rgba(255, 215, 0, 0.10)',
        stripe4: 'rgba(255, 140, 0, 0.08)',
      },
      border: {
        primary: '#FF6600',
        secondary: '#FF4500',
        decorative: '#FFD700',
      },
      suits: {
        hearts: '#FF4500',
        diamonds: '#FF6600',
        clubs: '#D2691E',
        spades: '#8B4513',
      },
      text: {
        primary: '#8B4513',
        secondary: '#A0522D',
        shadow: 'rgba(255, 102, 0, 0.3)',
      },
      effects: {
        glow: '#FF6600',
        shadow: 'rgba(255, 69, 0, 0.5)',
        hover: '#FF8C00',
      },
    },
    animations: {
      hoverGlow: {
        color: '#FF6600',
        intensity: 25,
        spread: 12,
      },
      pulseSpeed: 1.8,
    },
  },

  'royal-gold': {
    id: 'royal-gold',
    name: 'royal-gold',
    displayName: 'Royal Gold',
    description: 'Deep purple backgrounds with luxurious gold accents',
    emoji: '👑',
    colors: {
      background: {
        primary: '#4B0082',
        secondary: '#6A0DAD',
        tertiary: '#8B00FF',
        quaternary: '#4B0082',
      },
      patterns: {
        stripe1: 'rgba(255, 215, 0, 0.20)',
        stripe2: 'rgba(255, 191, 0, 0.15)',
        stripe3: 'rgba(218, 165, 32, 0.12)',
        stripe4: 'rgba(184, 134, 11, 0.10)',
      },
      border: {
        primary: '#FFD700',
        secondary: '#FFBF00',
        decorative: '#DAA520',
      },
      suits: {
        hearts: '#FFD700',
        diamonds: '#FFBF00',
        clubs: '#DAA520',
        spades: '#B8860B',
      },
      text: {
        primary: '#FFD700',
        secondary: '#FFFFFF',
        shadow: 'rgba(255, 215, 0, 0.5)',
      },
      effects: {
        glow: '#FFD700',
        shadow: 'rgba(255, 191, 0, 0.6)',
        hover: '#FFC700',
      },
    },
    animations: {
      hoverGlow: {
        color: '#FFD700',
        intensity: 30,
        spread: 15,
      },
      pulseSpeed: 2.5,
    },
  },

  'ocean-breeze': {
    id: 'ocean-breeze',
    name: 'ocean-breeze',
    displayName: 'Ocean Breeze',
    description: 'Turquoise backgrounds with fresh coastal vibes',
    emoji: '🌊',
    colors: {
      background: {
        primary: '#40E0D0',
        secondary: '#48D1CC',
        tertiary: '#AFEEEE',
        quaternary: '#40E0D0',
      },
      patterns: {
        stripe1: 'rgba(0, 128, 128, 0.15)',
        stripe2: 'rgba(0, 255, 255, 0.12)',
        stripe3: 'rgba(152, 255, 152, 0.10)',
        stripe4: 'rgba(127, 255, 212, 0.08)',
      },
      border: {
        primary: '#008080',
        secondary: '#00FFFF',
        decorative: '#7FFFD4',
      },
      suits: {
        hearts: '#FF6B6B',
        diamonds: '#4ECDC4',
        clubs: '#008080',
        spades: '#006994',
      },
      text: {
        primary: '#006994',
        secondary: '#008080',
        shadow: 'rgba(0, 128, 128, 0.3)',
      },
      effects: {
        glow: '#00FFFF',
        shadow: 'rgba(72, 209, 204, 0.5)',
        hover: '#7FFFD4',
      },
    },
    animations: {
      hoverGlow: {
        color: '#00FFFF',
        intensity: 25,
        spread: 12,
      },
      pulseSpeed: 2,
    },
  },

  'festival-drums': {
    id: 'festival-drums',
    name: 'festival-drums',
    displayName: 'Festival Drums',
    description: 'Multi-color celebration with rainbow energy',
    emoji: '🎉',
    colors: {
      background: {
        primary: '#FFE5F0',
        secondary: '#FFF5E6',
        tertiary: '#F0FFF0',
        quaternary: '#F0E6FF',
      },
      patterns: {
        stripe1: 'rgba(255, 20, 147, 0.15)',
        stripe2: 'rgba(255, 215, 0, 0.12)',
        stripe3: 'rgba(50, 205, 50, 0.10)',
        stripe4: 'rgba(139, 0, 255, 0.08)',
      },
      border: {
        primary: '#FF1493',
        secondary: '#FFD700',
        decorative: '#32CD32',
      },
      suits: {
        hearts: '#FF1493',
        diamonds: '#FFD700',
        clubs: '#32CD32',
        spades: '#8B00FF',
      },
      text: {
        primary: '#FF1493',
        secondary: '#8B00FF',
        shadow: 'rgba(255, 20, 147, 0.3)',
      },
      effects: {
        glow: '#FF1493',
        shadow: 'rgba(255, 215, 0, 0.5)',
        hover: '#FF69B4',
      },
    },
    animations: {
      hoverGlow: {
        color: '#FF1493',
        intensity: 35,
        spread: 18,
      },
      pulseSpeed: 1.2,
    },
  },
};

/**
 * Get the default theme
 */
export const getDefaultTheme = (): CardTheme => {
  return cardThemes['afro-heritage'];
};

/**
 * Get theme by ID
 */
export const getThemeById = (id: string): CardTheme | undefined => {
  return cardThemes[id];
};

/**
 * Get all theme IDs
 */
export const getAllThemeIds = (): string[] => {
  return Object.keys(cardThemes);
};

/**
 * Get all themes as array
 */
export const getAllThemes = (): CardTheme[] => {
  return Object.values(cardThemes);
};
