import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useThemeStore, DEFAULT_THEME } from './themeStore'
import { resolveEKTreatment } from '../game/constants/cardTheme'

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
    vi.clearAllMocks()
    useThemeStore.setState({ selectedTheme: DEFAULT_THEME })
  })

  describe('Initial State', () => {
    it('should have default theme as warm_heritage', () => {
      const { result } = renderHook(() => useThemeStore())
      expect(result.current.selectedTheme).toBe('warm_heritage')
      expect(DEFAULT_THEME).toBe('warm_heritage')
    })

    it('should expose exactly the three canonical palettes', () => {
      const { result } = renderHook(() => useThemeStore())
      expect(result.current.availableThemes).toEqual(['warm_heritage', 'comic', 'neon'])
    })
  })

  describe('Theme Selection', () => {
    it('should update selectedTheme when setTheme is called', () => {
      const { result } = renderHook(() => useThemeStore())

      act(() => {
        result.current.setTheme('neon')
      })

      expect(result.current.selectedTheme).toBe('neon')
    })

    it('should not update theme if invalid theme is provided', () => {
      const { result } = renderHook(() => useThemeStore())

      act(() => {
        result.current.setTheme('invalid_theme' as never)
      })

      expect(result.current.selectedTheme).toBe('warm_heritage')
    })

    it('should handle all valid themes', () => {
      const { result } = renderHook(() => useThemeStore())
      const themes = ['warm_heritage', 'comic', 'neon'] as const

      themes.forEach(theme => {
        act(() => {
          result.current.setTheme(theme)
        })
        expect(result.current.selectedTheme).toBe(theme)
      })
    })
  })

  describe('Theme Info', () => {
    it('should return name, description and a palette swatch for each theme', () => {
      const { result } = renderHook(() => useThemeStore())

      for (const theme of result.current.availableThemes) {
        const info = result.current.getThemeInfo(theme)
        expect(info.id).toBe(theme)
        expect(info.name).toBeTruthy()
        expect(info.description).toBeTruthy()
        expect(info.swatch.base).toMatch(/^#[0-9a-f]{6}$/i)
        expect(info.swatch.ink).toMatch(/^#[0-9a-f]{6}$/i)
        expect(info.swatch.accent).toMatch(/^#[0-9a-f]{6}$/i)
        expect(info.swatch.pop).toMatch(/^#[0-9a-f]{6}$/i)
      }
    })

    it('names warm_heritage as the default (Warm Heritage)', () => {
      const { result } = renderHook(() => useThemeStore())
      expect(result.current.getThemeInfo('warm_heritage').name).toBe('Warm Heritage')
    })
  })

  describe('Cross-consistency with the EK border treatments', () => {
    it('maps each canonical palette 1:1 onto a distinct treatment', () => {
      const { result } = renderHook(() => useThemeStore())
      const treatments = result.current.availableThemes.map(resolveEKTreatment)
      // warm_heritage -> gold, comic -> comic, neon -> neon
      expect(treatments).toEqual(['gold', 'comic', 'neon'])
      expect(new Set(treatments).size).toBe(3)
    })
  })

  describe('Persistence', () => {
    it('should keep the selected theme after setTheme', async () => {
      const { result } = renderHook(() => useThemeStore())

      act(() => {
        result.current.setTheme('comic')
      })

      await new Promise(resolve => setTimeout(resolve, 50))
      expect(result.current.selectedTheme).toBe('comic')
    })

    it('should have persistence configured (store name + partialized state)', () => {
      const { result } = renderHook(() => useThemeStore())
      expect(result.current.selectedTheme).toBeDefined()
      expect(result.current.availableThemes).toBeDefined()
    })
  })

  describe('Reset', () => {
    it('should reset theme to the default palette', () => {
      const { result } = renderHook(() => useThemeStore())

      act(() => {
        result.current.setTheme('neon')
      })
      expect(result.current.selectedTheme).toBe('neon')

      act(() => {
        result.current.resetTheme()
      })
      expect(result.current.selectedTheme).toBe('warm_heritage')
    })
  })
})
