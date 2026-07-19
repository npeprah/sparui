import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cardVariants, getVariants, getPrefersReducedMotion } from '../../utils/animations'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'elevated' | 'bordered'
  hoverable?: boolean
  onClick?: () => void
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

const variantStyles = {
  default: 'bg-gray-800',
  elevated: 'bg-gray-800 shadow-2xl',
  bordered: 'bg-gray-800 border-2 border-gray-700',
}

export function Card({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  hoverable = false,
  onClick,
}: CardProps) {
  const prefersReducedMotion = getPrefersReducedMotion()
  const variants = getVariants(cardVariants)

  const baseClassName = `rounded-lg ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`

  // If card is hoverable or has onClick, add cursor pointer and use motion
  if (hoverable || onClick) {
    return (
      <motion.div
        className={`${baseClassName} ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
        whileHover={prefersReducedMotion ? undefined : 'hover'}
        whileTap={prefersReducedMotion || !onClick ? undefined : 'tap'}
        variants={variants}
      >
        {children}
      </motion.div>
    )
  }

  // Regular card without animations
  return <div className={baseClassName}>{children}</div>
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

interface CardTitleProps {
  children: ReactNode
  className?: string
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return <h3 className={`text-xl font-bold text-gold ${className}`}>{children}</h3>
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={className}>{children}</div>
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return <div className={`mt-4 pt-4 border-t border-gray-700 ${className}`}>{children}</div>
}

// Attach sub-components
Card.Header = CardHeader
Card.Title = CardTitle
Card.Content = CardContent
Card.Footer = CardFooter
