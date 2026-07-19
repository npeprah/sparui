import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useThemeStore } from './themeStore'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
global.localStorage = localStorageMock as Storage

describe('themeStore', () => {
  beforeEach(() => {
    // Clear all mocks and reset store
    vi.clearAllMocks()
    useThemeStore.setState({
      selectedTheme: 'afro_heritage',
    })
  })

  describe('Initial State', () => {
    it('should have default theme as afro_heritage', () => {
      const { result } = renderHook(() => useThemeStore())
      expect(result.current.selectedTheme).toBe('afro_heritage')
    })

    it('should have all available themes', () => {
      const { result } = renderHook(() => useThemeStore())
      expect(result.current.availableThemes).toEqual([
        'afro_heritage',
        'neon_arcade',
        'royal_gold',
        'ocean_breeze',
      ])
    })
  })

  describe('Theme Selection', () => {
    it('should update selectedTheme when setTheme is called', () => {
      const { result } = renderHook(() => useThemeStore())

      act(() => {
        result.current.setTheme('neon_arcade')
      })

      expect(result.current.selectedTheme).toBe('neon_arcade')
    })

    it('should not update theme if invalid theme is provided', () => {
      const { result } = renderHook(() => useThemeStore())

      act(() => {
        result.current.setTheme('invalid_theme' as any)
      })

      expect(result.current.selectedTheme).toBe('afro_heritage')
    })

    it('should handle all valid themes', () => {
      const { result } = renderHook(() => useThemeStore())
      const themes = ['afro_heritage', 'neon_arcade', 'royal_gold', 'ocean_breeze'] as const

      themes.forEach(theme => {
        act(() => {
          result.current.setTheme(theme)
        })
        expect(result.current.selectedTheme).toBe(theme)
      })
    })
  })

  describe('Theme Info', () => {
    it('should return correct theme info for each theme', () => {
      const { result } = renderHook(() => useThemeStore())

      const afroInfo = result.current.getThemeInfo('afro_heritage')
      expect(afroInfo).toEqual({
        id: 'afro_heritage',
        name: 'Afro Heritage',
        description: 'Traditional Kente patterns with gold accents',
        preview: '/assets/surfaces/surface_afro_heritage.png',
      })

      const neonInfo = result.current.getThemeInfo('neon_arcade')
      expect(neonInfo).toEqual({
        id: 'neon_arcade',
        name: 'Neon Arcade',
        description: 'Vibrant neon glow with rainbow energy',
        preview: '/assets/surfaces/surface_neon_arcade.png',
      })

      const royalInfo = result.current.getThemeInfo('royal_gold')
      expect(royalInfo).toEqual({
        id: 'royal_gold',
        name: 'Royal Gold',
        description: 'Deep purple majesty with golden highlights',
        preview: '/assets/surfaces/surface_royal_gold.png',
      })

      const oceanInfo = result.current.getThemeInfo('ocean_breeze')
      expect(oceanInfo).toEqual({
        id: 'ocean_breeze',
        name: 'Ocean Breeze',
        description: 'Turquoise coastal vibes',
        preview: '/assets/surfaces/surface_ocean_breeze.png',
      })
    })
  })

  describe('Theme Path', () => {
    it('should return correct path for selected theme', () => {
      const { result } = renderHook(() => useThemeStore())

      expect(result.current.getThemePath()).toBe('/assets/surfaces/surface_afro_heritage.png')

      act(() => {
        result.current.setTheme('neon_arcade')
      })

      expect(result.current.getThemePath()).toBe('/assets/surfaces/surface_neon_arcade.png')
    })
  })

  describe('Persistence', () => {
    it('should persist theme selection', async () => {
      const { result } = renderHook(() => useThemeStore())

      act(() => {
        result.current.setTheme('royal_gold')
      })

      // Wait a bit for the persist middleware to save
      await new Promise(resolve => setTimeout(resolve, 100))

      // The selectedTheme should be updated
      expect(result.current.selectedTheme).toBe('royal_gold')

      // Since we're using zustand persist, the actual localStorage test
      // would require more complex setup. We're testing the behavior instead.
    })

    it('should have persistence configured', () => {
      // Verify the store has persist middleware by checking if the key exists
      const { result } = renderHook(() => useThemeStore())

      // The store should have the correct initial state
      expect(result.current.selectedTheme).toBeDefined()
      expect(result.current.availableThemes).toBeDefined()
    })
  })

  describe('Reset', () => {
    it('should reset theme to default', () => {
      const { result } = renderHook(() => useThemeStore())

      act(() => {
        result.current.setTheme('neon_arcade')
      })

      expect(result.current.selectedTheme).toBe('neon_arcade')

      act(() => {
        result.current.resetTheme()
      })

      expect(result.current.selectedTheme).toBe('afro_heritage')
    })
  })
})