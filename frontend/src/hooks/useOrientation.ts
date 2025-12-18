import { useState, useEffect } from 'react'

export type Orientation = 'portrait' | 'landscape'

export interface OrientationResult {
  orientation: Orientation
  isPortrait: boolean
  isLandscape: boolean
}

/**
 * Custom hook for detecting screen orientation
 *
 * Detects whether the device is in portrait or landscape mode
 * based on window dimensions. Useful for Phaser game canvas
 * and responsive layouts.
 *
 * @returns Object containing orientation state and boolean flags
 *
 * @example
 * ```tsx
 * const { orientation, isPortrait, isLandscape } = useOrientation()
 *
 * if (isLandscape) {
 *   return <LandscapeGameView />
 * }
 * ```
 */
export function useOrientation(): OrientationResult {
  const [orientation, setOrientation] = useState<OrientationResult>(() => {
    if (typeof window === 'undefined') {
      return {
        orientation: 'portrait',
        isPortrait: true,
        isLandscape: false,
      }
    }

    const isLandscape = window.innerWidth > window.innerHeight

    return {
      orientation: isLandscape ? 'landscape' : 'portrait',
      isPortrait: !isLandscape,
      isLandscape,
    }
  })

  useEffect(() => {
    const handleResize = () => {
      const isLandscape = window.innerWidth > window.innerHeight

      setOrientation({
        orientation: isLandscape ? 'landscape' : 'portrait',
        isPortrait: !isLandscape,
        isLandscape,
      })
    }

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Initial check
    handleResize()

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return orientation
}
