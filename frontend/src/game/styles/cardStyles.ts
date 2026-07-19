/**
 * Card Styles - CSS-in-JS implementation of CARD_DESIGN_HANDOFF.md styles
 *
 * Provides styles for all card states including Kente pattern implementation
 */

export interface CardStyleState {
  background?: string
  border?: string
  boxShadow?: string
  transform?: string
  opacity?: number
  filter?: string
  cursor?: string
  pointerEvents?: string
  animation?: string
}

/**
 * Color palette by suit - from design spec
 */
export const SUIT_COLORS = {
  hearts: {
    primary: '#FF4500', // Fire Red
    secondary: '#FFD700', // Gold
    accent: '#DC143C', // Crimson
    backgroundStart: '#FFF9F0',
    backgroundMid: '#FFE8D6',
    backgroundEnd: '#FFF5E6',
    pattern: 'rgba(229, 57, 53, 0.15)', // Kente Red
  },
  clubs: {
    primary: '#0A5F38', // Rich Green
    secondary: '#FFD700', // Gold
    accent: '#006400', // Dark Forest
    backgroundStart: '#F0FFF4',
    backgroundMid: '#D6F5E0',
    backgroundEnd: '#E6FFF0',
    pattern: 'rgba(0, 100, 0, 0.15)',
  },
  diamonds: {
    primary: '#FFD700', // Gold
    secondary: '#8B00FF', // Deep Purple
    accent: '#FFBF00', // Amber
    backgroundStart: '#FFFAF0',
    backgroundMid: '#FFF0D6',
    backgroundEnd: '#FFF8E6',
    pattern: 'rgba(255, 215, 0, 0.15)',
  },
  spades: {
    primary: '#8B00FF', // Deep Purple
    secondary: '#00BFFF', // Ice Blue
    accent: '#191970', // Midnight Blue
    backgroundStart: '#F5F0FF',
    backgroundMid: '#E8D6FF',
    backgroundEnd: '#F0E6FF',
    pattern: 'rgba(139, 0, 255, 0.15)',
  },
} as const

/**
 * Generate Kente pattern CSS background
 */
export function generateKentePattern(suitColor: string): string {
  return `
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 10px,
      ${suitColor} 10px,
      ${suitColor} 20px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 10px,
      rgba(251, 192, 45, 0.1) 10px,
      rgba(251, 192, 45, 0.1) 20px
    ),
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 15px,
      rgba(255, 69, 0, 0.08) 15px,
      rgba(255, 69, 0, 0.08) 30px
    )
  `
}

/**
 * Card state styles matching design spec exactly
 */
export const CARD_STATES: Record<string, CardStyleState> = {
  // Default State - from design spec
  default: {
    background: 'linear-gradient(135deg, #FFF9F0 0%, #FFE8D6 50%, #FFF5E6 100%)',
    border: '4px solid #FBC02D', // Gold border
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 69, 0, 0.3)',
    transform: 'none',
    opacity: 1,
    cursor: 'pointer',
    pointerEvents: 'auto',
  },

  // Hover State - exact specs
  hover: {
    transform: 'translateY(-30px) rotateY(10deg) scale(1.05)',
    boxShadow: `
      0 40px 80px rgba(255, 69, 0, 0.4),
      0 0 60px rgba(255, 215, 0, 0.6),
      inset 0 0 30px rgba(255, 215, 0, 0.2)
    `,
    cursor: 'pointer',
  },

  // Active State (Played)
  active: {
    transform: 'scale(0.95)',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
  },

  // Fire State - animated gradient border
  fire: {
    border: '4px solid transparent',
    boxShadow: '0 0 30px rgba(255, 69, 0, 0.8), 0 0 60px rgba(255, 140, 0, 0.6)',
    animation: 'fireBorder 1s infinite',
  },

  // Frozen State - ice blue crystalline
  frozen: {
    border: '4px solid #00BFFF',
    boxShadow: '0 0 30px rgba(0, 191, 255, 0.8), inset 0 0 20px rgba(135, 206, 235, 0.4)',
    filter: 'hue-rotate(180deg) brightness(1.1)',
  },

  // Disabled State - not playable
  disabled: {
    opacity: 0.5,
    filter: 'grayscale(0.6)',
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },

  // Loading State (Being Dealt)
  loading: {
    opacity: 0,
    transform: 'translateX(-200px) translateY(100px) rotate(-15deg)',
  },

  // Win State - intense gold glow
  winner: {
    boxShadow: `
      0 0 40px rgba(255, 215, 0, 1),
      0 0 80px rgba(255, 215, 0, 0.8),
      0 0 120px rgba(255, 215, 0, 0.6)
    `,
    animation: 'winPulse 1s ease-in-out infinite',
  },

  // Lose State - faded
  loser: {
    opacity: 0.7,
    filter: 'brightness(0.8)',
    transform: 'scale(0.95)',
  },
}

/**
 * CSS Keyframe animations as strings
 */
export const KEYFRAME_ANIMATIONS = `
  @keyframes fireBorder {
    0% {
      border-image: linear-gradient(45deg, #FF4500, #FF8C00, #FFD700) 1;
      filter: drop-shadow(0 0 20px rgba(255, 69, 0, 0.6));
    }
    50% {
      border-image: linear-gradient(45deg, #FFD700, #FF4500, #FF8C00) 1;
      filter: drop-shadow(0 0 30px rgba(255, 140, 0, 0.8));
    }
    100% {
      border-image: linear-gradient(45deg, #FF8C00, #FFD700, #FF4500) 1;
      filter: drop-shadow(0 0 20px rgba(255, 69, 0, 0.6));
    }
  }

  @keyframes winPulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.08);
    }
  }

  @keyframes suitPulse {
    0%, 100% {
      filter: drop-shadow(0 8px 16px rgba(220, 20, 60, 0.5));
      transform: scale(1);
    }
    50% {
      filter: drop-shadow(0 12px 24px rgba(255, 215, 0, 0.7));
      transform: scale(1.05);
    }
  }

  @keyframes freezePulse {
    0%, 100% {
      filter: drop-shadow(0 0 20px rgba(0, 191, 255, 0.8));
    }
    50% {
      filter: drop-shadow(0 0 40px rgba(0, 191, 255, 1));
    }
  }

  @keyframes cardDeal {
    from {
      opacity: 0;
      transform: translateX(-200px) translateY(100px) rotate(-15deg);
    }
    to {
      opacity: 1;
      transform: translateX(0) translateY(0) rotate(0);
    }
  }

  @keyframes cardFloat {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`

/**
 * Typography styles from design spec
 */
export const TYPOGRAPHY = {
  cornerIndicator: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '40px',
    fontWeight: 900,
    color: '#FF4500',
    textShadow: '2px 2px 0 #DC143C, 0 0 10px rgba(255, 69, 0, 0.6)',
    lineHeight: 1,
  },
  suitIndicator: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '28px',
    fontWeight: 900,
    color: '#FF4500',
    textShadow: '2px 2px 0 #DC143C, 0 0 10px rgba(255, 69, 0, 0.6)',
    lineHeight: 1,
  },
  faceCardTitle: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '40px',
    fontWeight: 400,
    color: '#FF4500',
    letterSpacing: '4px',
    textShadow: '2px 2px 0 #212121, 0 0 20px rgba(255, 215, 0, 0.8)',
  },
  faceCardDescription: {
    fontFamily: '"Barlow", sans-serif',
    fontSize: '16px',
    fontWeight: 600,
    color: '#212121',
    lineHeight: 1.4,
    opacity: 0.8,
    textAlign: 'center' as const,
  },
}

/**
 * Build complete card style object
 */
export function buildCardStyle(
  state: keyof typeof CARD_STATES,
  suit?: keyof typeof SUIT_COLORS
): CardStyleState {
  const baseStyle = CARD_STATES[state]

  if (suit && state === 'default') {
    const suitColors = SUIT_COLORS[suit]
    return {
      ...baseStyle,
      background: `
        ${generateKentePattern(suitColors.pattern)},
        linear-gradient(135deg,
          ${suitColors.backgroundStart} 0%,
          ${suitColors.backgroundMid} 50%,
          ${suitColors.backgroundEnd} 100%
        )
      `,
    }
  }

  return baseStyle
}

/**
 * Get animation duration from state
 */
export function getAnimationDuration(state: string): number {
  const durations: Record<string, number> = {
    deal: 800,
    play: 400,
    hover: 600,
    flip: 350,
    win: 1000,
    lose: 600,
    collect: 800,
  }
  return durations[state] || 400
}

/**
 * Get easing function for animation
 */
export function getAnimationEasing(state: string): string {
  const easings: Record<string, string> = {
    deal: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Bounce
    play: 'ease-out',
    hover: 'cubic-bezier(0.23, 1, 0.32, 1)',
    flip: 'cubic-bezier(0.4, 0, 0.2, 1)',
    win: 'ease-in-out',
    lose: 'ease-out',
    collect: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }
  return easings[state] || 'ease-out'
}

/**
 * Apply styles to DOM element
 */
export function applyCardStyles(
  element: HTMLElement,
  state: keyof typeof CARD_STATES,
  suit?: keyof typeof SUIT_COLORS
): void {
  const styles = buildCardStyle(state, suit)

  Object.entries(styles).forEach(([property, value]) => {
    if (property === 'animation') {
      element.style.animation = value as string
    } else if (property === 'transform') {
      element.style.transform = value as string
    } else if (property === 'opacity') {
      element.style.opacity = String(value)
    } else {
      ;(element.style as any)[property] = value
    }
  })
}

/**
 * Create style sheet with all animations
 */
export function createCardStyleSheet(): HTMLStyleElement {
  const style = document.createElement('style')
  style.textContent = KEYFRAME_ANIMATIONS
  return style
}

/**
 * Inject card styles into document
 */
export function injectCardStyles(): void {
  if (!document.getElementById('card-animations')) {
    const styleSheet = createCardStyleSheet()
    styleSheet.id = 'card-animations'
    document.head.appendChild(styleSheet)
  }
}