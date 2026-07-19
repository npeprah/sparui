import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * The three canonical EK table palettes (ticket 15).
 *
 * The table STRUCTURE is fixed (A-layout + B-chrome + C-ring); only the base
 * PALETTE is swappable in settings. These keys are the single source of truth
 * for the palette selection and map 1:1 onto the EK border treatments in
 * `game/constants/cardTheme.ts` (`warm_heritage -> gold`, `comic -> comic`,
 * `neon -> neon`). Card FACES stay palette-agnostic - only the chrome, borders,
 * card back and callouts reskin.
 */
export type ThemeName = 'warm_heritage' | 'comic' | 'neon'

/** A small palette used to render the settings picker swatch (CSS hex strings). */
export interface ThemeSwatch {
  /** Dominant surface / background colour. */
  base: string
  /** Chunky ink outline colour. */
  ink: string
  /** Accent / highlight colour. */
  accent: string
  /** Pop / secondary colour. */
  pop: string
}

interface ThemeInfo {
  id: ThemeName
  name: string
  description: string
  /** Palette-honest swatch for the settings preview (no image asset needed). */
  swatch: ThemeSwatch
}

interface ThemeState {
  selectedTheme: ThemeName
  availableThemes: ThemeName[]
  setTheme: (theme: ThemeName) => void
  getThemeInfo: (theme: ThemeName) => ThemeInfo
  resetTheme: () => void
}

/** The default palette; matches the EK "Warm Heritage" direction. */
export const DEFAULT_THEME: ThemeName = 'warm_heritage'

const themeData: Record<ThemeName, ThemeInfo> = {
  warm_heritage: {
    id: 'warm_heritage',
    name: 'Warm Heritage',
    description: 'Cream, red and gold - the classic EK look (default)',
    swatch: { base: '#f5e6c8', ink: '#14100c', accent: '#ffd700', pop: '#e4002b' },
  },
  comic: {
    id: 'comic',
    name: 'Comic',
    description: 'Loud pop-art yellow with ink-black panels',
    swatch: { base: '#ffd400', ink: '#14100c', accent: '#ff5a1f', pop: '#ffffff' },
  },
  neon: {
    id: 'neon',
    name: 'Neon',
    description: 'Dark arcade base with cyan and magenta glow',
    swatch: { base: '#0d0221', ink: '#00f5ff', accent: '#ff006e', pop: '#2a0a4a' },
  },
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      selectedTheme: DEFAULT_THEME,
      availableThemes: ['warm_heritage', 'comic', 'neon'],

      setTheme: theme => {
        // Validate theme before setting.
        if (themeData[theme]) {
          set({ selectedTheme: theme })
        }
      },

      getThemeInfo: theme => {
        return themeData[theme]
      },

      resetTheme: () => {
        set({ selectedTheme: DEFAULT_THEME })
      },
    }),
    {
      name: 'spar-theme-storage',
      partialize: state => ({
        selectedTheme: state.selectedTheme,
      }),
    }
  )
)
