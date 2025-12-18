/**
 * Responsive utility functions and constants for the Spar card game
 *
 * Provides breakpoint definitions, device detection helpers,
 * and viewport utilities for building responsive layouts.
 */

/**
 * Standard breakpoint values in pixels
 *
 * Mobile: 0 - 767px
 * Tablet: 768px - 1023px
 * Desktop: 1024px and above
 */
export const BREAKPOINTS = {
  mobile: 767,
  tablet: 1023,
  desktop: 1024,
} as const

/**
 * Minimum touch target size for mobile devices (in pixels)
 * Based on WCAG accessibility guidelines
 */
export const MIN_TOUCH_TARGET_SIZE = 48

/**
 * Device type based on current viewport width
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

/**
 * Viewport dimension information
 */
export interface ViewportDimensions {
  width: number
  height: number
  aspectRatio: number
  isPortrait: boolean
  isLandscape: boolean
}

/**
 * Determines the current device type based on window width
 *
 * @returns The device type ('mobile', 'tablet', or 'desktop')
 *
 * @example
 * ```ts
 * const deviceType = getDeviceType()
 * if (deviceType === 'mobile') {
 *   // Apply mobile-specific logic
 * }
 * ```
 */
export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') {
    return 'desktop'
  }

  const width = window.innerWidth

  if (width <= BREAKPOINTS.mobile) {
    return 'mobile'
  }

  if (width <= BREAKPOINTS.tablet) {
    return 'tablet'
  }

  return 'desktop'
}

/**
 * Checks if the device supports touch events
 *
 * @returns True if device supports touch
 *
 * @example
 * ```ts
 * if (isTouchDevice()) {
 *   // Enable touch-specific interactions
 * }
 * ```
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const nav = navigator as Navigator & { msMaxTouchPoints?: number }
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (nav.msMaxTouchPoints !== undefined && nav.msMaxTouchPoints > 0)
  )
}

/**
 * Gets current viewport dimensions and orientation info
 *
 * @returns Object containing viewport width, height, aspect ratio, and orientation
 *
 * @example
 * ```ts
 * const { width, height, isPortrait } = getViewportDimensions()
 * console.log(`Viewport: ${width}x${height}, Portrait: ${isPortrait}`)
 * ```
 */
export function getViewportDimensions(): ViewportDimensions {
  if (typeof window === 'undefined') {
    return {
      width: 1024,
      height: 768,
      aspectRatio: 4 / 3,
      isPortrait: false,
      isLandscape: true,
    }
  }

  const width = window.innerWidth
  const height = window.innerHeight
  const aspectRatio = width / height
  const isLandscape = width > height

  return {
    width,
    height,
    aspectRatio,
    isPortrait: !isLandscape,
    isLandscape,
  }
}

/**
 * Utility class names for responsive design
 *
 * Provides commonly used Tailwind class combinations
 */
export const RESPONSIVE_CLASSES = {
  container: 'w-full mx-auto px-4 sm:px-6 lg:px-8',
  touchTarget: 'min-h-[48px] min-w-[48px]',
  hideOnMobile: 'hidden md:block',
  hideOnDesktop: 'block md:hidden',
  stackOnMobile: 'flex flex-col md:flex-row',
  textResponsive: {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl',
    '3xl': 'text-3xl sm:text-4xl',
    '4xl': 'text-4xl sm:text-5xl lg:text-6xl',
  },
} as const
