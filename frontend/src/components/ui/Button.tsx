import { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { buttonVariants, getVariants, getPrefersReducedMotion } from '../../utils/animations'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

// Omit conflicting motion props from ButtonHTMLAttributes
type ButtonBaseProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'
>

interface ButtonProps extends ButtonBaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  children: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-fireRed hover:bg-opacity-80 text-white',
  secondary: 'bg-deepPurple hover:bg-opacity-80 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  ghost: 'bg-gray-700 hover:bg-gray-600 text-white',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm md:text-base',
  md: 'px-6 py-3 text-base md:text-lg',
  lg: 'px-8 py-4 text-lg md:text-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center'
  const widthStyle = fullWidth ? 'w-full' : ''

  const finalClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`.trim()

  // Get animation variants with reduced motion support
  const variants = getVariants(buttonVariants)
  const prefersReducedMotion = getPrefersReducedMotion()

  return (
    <motion.button
      className={finalClassName}
      disabled={disabled}
      variants={variants}
      whileHover={disabled || prefersReducedMotion ? undefined : 'hover'}
      whileTap={disabled || prefersReducedMotion ? undefined : 'tap'}
      {...(props as HTMLMotionProps<'button'>)}
    >
      {children}
    </motion.button>
  )
}
