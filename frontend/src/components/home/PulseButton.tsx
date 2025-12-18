import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { pulseVariants, getVariants, getPrefersReducedMotion } from '../../utils/animations'

interface PulseButtonProps {
  children: ReactNode
  className?: string
  disabled?: boolean
}

/**
 * PulseButton Component
 *
 * Wraps children with a subtle pulse animation for emphasis
 * Used for primary actions to draw user attention
 *
 * Features:
 * - Infinite pulse animation (scale 1.0 -> 1.05 -> 1.0)
 * - Respects prefers-reduced-motion
 * - Can be disabled to stop animation
 */
export function PulseButton({ children, className = '', disabled = false }: PulseButtonProps) {
  const prefersReducedMotion = getPrefersReducedMotion()
  const variants = getVariants(pulseVariants)

  // Disable animation if user prefers reduced motion or component is disabled
  const shouldAnimate = !prefersReducedMotion && !disabled

  return (
    <motion.div
      className={className}
      variants={shouldAnimate ? variants : undefined}
      initial={shouldAnimate ? 'initial' : undefined}
      animate={shouldAnimate ? 'pulse' : undefined}
    >
      {children}
    </motion.div>
  )
}
