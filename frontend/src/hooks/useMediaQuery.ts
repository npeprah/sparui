import { useState, useEffect } from 'react'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export interface MediaQueryResult {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  deviceType: DeviceType
}

/**
 * Custom hook for responsive breakpoint detection
 *
 * Breakpoints:
 * - Mobile: < 768px
 * - Tablet: 768px - 1023px
 * - Desktop: >= 1024px
 *
 * @returns Object containing boolean flags and device type string
 *
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop, deviceType } = useMediaQuery()
 *
 * if (isMobile) {
 *   return <MobileLayout />
 * }
 * ```
 */
export function useMediaQuery(): MediaQueryResult {
  const [matches, setMatches] = useState<MediaQueryResult>(() => {
    // Initialize with current window size
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        deviceType: 'desktop',
      }
    }

    const width = window.innerWidth
    const isMobile = width < 768
    const isTablet = width >= 768 && width < 1024
    const isDesktop = width >= 1024

    return {
      isMobile,
      isTablet,
      isDesktop,
      deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
    }
  })

  useEffect(() => {
    // Media query lists
    const mobileQuery = window.matchMedia('(max-width: 767px)')
    const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)')
    const desktopQuery = window.matchMedia('(min-width: 1024px)')

    const updateMatches = () => {
      const isMobile = mobileQuery.matches
      const isTablet = tabletQuery.matches
      const isDesktop = desktopQuery.matches

      setMatches({
        isMobile,
        isTablet,
        isDesktop,
        deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      })
    }

    // Set initial state
    updateMatches()

    // Add listeners
    mobileQuery.addEventListener('change', updateMatches)
    tabletQuery.addEventListener('change', updateMatches)
    desktopQuery.addEventListener('change', updateMatches)

    // Cleanup
    return () => {
      mobileQuery.removeEventListener('change', updateMatches)
      tabletQuery.removeEventListener('change', updateMatches)
      desktopQuery.removeEventListener('change', updateMatches)
    }
  }, [])

  return matches
}
