import { ReactNode } from 'react'

export type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ResponsiveContainerProps {
  children: ReactNode
  maxWidth?: MaxWidth
  padding?: boolean
  className?: string
}

const maxWidthStyles: Record<MaxWidth, string> = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-screen-xl',
  full: 'max-w-full',
}

/**
 * Responsive container component that provides consistent max-width
 * and padding across different screen sizes.
 *
 * @param children - Child elements to render inside the container
 * @param maxWidth - Maximum width constraint ('sm', 'md', 'lg', 'xl', 'full')
 * @param padding - Whether to apply responsive padding (default: true)
 * @param className - Additional CSS classes to apply
 *
 * @example
 * ```tsx
 * <ResponsiveContainer maxWidth="lg">
 *   <h1>My Content</h1>
 * </ResponsiveContainer>
 * ```
 */
export function ResponsiveContainer({
  children,
  maxWidth = 'lg',
  padding = true,
  className = '',
}: ResponsiveContainerProps) {
  const paddingClasses = padding ? 'px-4 sm:px-6 lg:px-8' : ''

  const classes = ['w-full', 'mx-auto', maxWidthStyles[maxWidth], paddingClasses, className]
    .filter(Boolean)
    .join(' ')

  return <div className={classes}>{children}</div>
}
