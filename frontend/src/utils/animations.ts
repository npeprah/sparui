import { Variants, Transition } from 'framer-motion'

/**
 * Animation utilities for Spar card game
 * "Afro-Futurism Meets Arcade Energy" aesthetic
 * Fast, energetic, celebratory animations
 */

// ============================================================================
// COMMON TRANSITIONS
// ============================================================================

/**
 * Spring transition for bouncy, energetic animations
 * Used for celebratory actions and arcade feel
 */
export const spring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
}

/**
 * Fast transition for quick, snappy UI responses
 * Duration: 0.2s - arcade speed
 */
export const fast: Transition = {
  duration: 0.2,
  ease: 'easeOut',
}

/**
 * Medium transition for noticeable but smooth animations
 * Duration: 0.3s
 */
export const medium: Transition = {
  duration: 0.3,
  ease: 'easeInOut',
}

/**
 * Slower transition for page-level animations
 * Duration: 0.4s
 */
export const slow: Transition = {
  duration: 0.4,
  ease: 'easeInOut',
}

// ============================================================================
// PAGE TRANSITIONS
// ============================================================================

/**
 * Page enter/exit animations
 * Fade + slide for smooth page transitions
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: medium,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: fast,
  },
}

// ============================================================================
// BUTTON ANIMATIONS
// ============================================================================

/**
 * Button hover and tap animations
 * Scale up on hover, scale down on tap for tactile feedback
 */
export const buttonVariants: Variants = {
  hover: {
    scale: 1.05,
    transition: fast,
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
}

// ============================================================================
// MODAL ANIMATIONS
// ============================================================================

/**
 * Modal backdrop fade animation
 */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: fast },
  exit: { opacity: 0, transition: fast },
}

/**
 * Modal content scale + fade animation
 * Scales from 0.9 to 1.0 for subtle "pop-in" effect
 */
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: medium,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: fast,
  },
}

// ============================================================================
// CARD ANIMATIONS
// ============================================================================

/**
 * Card component animations
 * Hover lift effect for interactive cards
 */
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    rotateZ: -10,
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateZ: 0,
    transition: slow,
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: fast,
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
}

// ============================================================================
// STAGGER ANIMATIONS
// ============================================================================

/**
 * Container for staggered children animations
 * Used for lists, button groups, etc.
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

/**
 * Child item for stagger animations
 * Fades in and slides up
 */
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: fast,
  },
}

// ============================================================================
// PULSE ANIMATIONS
// ============================================================================

/**
 * Pulse animation for ready status indicators
 * Subtle scale pulse that repeats
 */
export const pulseVariants: Variants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 2,
      ease: 'easeInOut',
    },
  },
}

/**
 * Glow pulse animation for emphasis
 * Used with box-shadow for visual feedback
 */
export const glowPulseVariants: Variants = {
  initial: { opacity: 0.8 },
  pulse: {
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ============================================================================
// PLAYER SLOT ANIMATIONS
// ============================================================================

/**
 * Player join animation
 * Slides in from right + fade
 */
export const playerJoinVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 100,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: slow,
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: medium,
  },
}

// ============================================================================
// NOTIFICATION/TOAST ANIMATIONS
// ============================================================================

/**
 * Toast/notification animations
 * Slide from top + bounce
 */
export const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -50,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -50,
    transition: fast,
  },
}

// ============================================================================
// COPY FEEDBACK ANIMATIONS
// ============================================================================

/**
 * Scale pulse for copy success feedback
 */
export const copySuccessVariants: Variants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.1, 1],
    transition: { duration: 0.3 },
  },
}

/**
 * Copied text feedback animation
 * Slide up + fade in, then fade out
 */
export const copiedTextVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: fast,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: fast,
  },
}

// ============================================================================
// ACCESSIBILITY: REDUCED MOTION SUPPORT
// ============================================================================

/**
 * Check if user prefers reduced motion
 * Respects system accessibility settings
 */
export function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get transition with reduced motion support
 * Returns instant transition if user prefers reduced motion
 */
export function getTransition(transition: Transition): Transition {
  if (getPrefersReducedMotion()) {
    return { duration: 0.01 }
  }
  return transition
}

/**
 * Get variants with reduced motion support
 * Removes animations if user prefers reduced motion
 */
export function getVariants(variants: Variants): Variants {
  if (getPrefersReducedMotion()) {
    // Return variants with no animation differences
    return Object.keys(variants).reduce((acc, key) => {
      acc[key] = { transition: { duration: 0.01 } }
      return acc
    }, {} as Variants)
  }
  return variants
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Check if device prefers reduced performance
 * Returns true on low-end devices or when battery is low
 */
export function shouldReduceAnimations(): boolean {
  if (getPrefersReducedMotion()) return true

  // Check if device is low-end (simplified heuristic)
  if (typeof navigator !== 'undefined') {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (connection && connection.saveData) {
      return true
    }
  }

  return false
}

/**
 * Animation config preset: Normal (full animations)
 */
export const ANIMATION_CONFIG_NORMAL = {
  useSpring: true,
  stagger: 0.1,
  duration: 0.3,
}

/**
 * Animation config preset: Reduced (simplified animations)
 */
export const ANIMATION_CONFIG_REDUCED = {
  useSpring: false,
  stagger: 0,
  duration: 0.01,
}

/**
 * Get animation config based on user preferences
 */
export function getAnimationConfig() {
  return shouldReduceAnimations() ? ANIMATION_CONFIG_REDUCED : ANIMATION_CONFIG_NORMAL
}
