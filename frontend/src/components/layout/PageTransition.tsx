import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { pageVariants, getVariants } from '../../utils/animations'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

/**
 * PageTransition Wrapper Component
 *
 * Provides consistent page-level enter/exit animations for route transitions.
 * Automatically respects user's reduced motion preferences.
 *
 * Usage:
 * ```tsx
 * function MyPage() {
 *   return (
 *     <PageTransition>
 *       <div>Page content here</div>
 *     </PageTransition>
 *   )
 * }
 * ```
 */
export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const variants = getVariants(pageVariants)

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  )
}
