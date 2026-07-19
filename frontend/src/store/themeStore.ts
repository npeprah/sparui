import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeName = 'afro_heritage' | 'neon_arcade' | 'royal_gold' | 'ocean_breeze'

interface ThemeInfo {
  id: ThemeName
  name: string
  description: string
  preview: string
}

interface ThemeState {
  selectedTheme: ThemeName
  availableThemes: ThemeName[]
  setTheme: (theme: ThemeName) => void
  getThemeInfo: (theme: ThemeName) => ThemeInfo
  getThemePath: () => string
  resetTheme: () => void
}

const themeData: Record<ThemeName, ThemeInfo> = {
  afro_heritage: {
    id: 'afro_heritage',
    name: 'Afro Heritage',
    description: 'Traditional Kente patterns with gold accents',
    preview: '/assets/surfaces/surface_afro_heritage.png',
  },
  neon_arcade: {
    id: 'neon_arcade',
    name: 'Neon Arcade',
    description: 'Vibrant neon glow with rainbow energy',
    preview: '/assets/surfaces/surface_neon_arcade.png',
  },
  royal_gold: {
    id: 'royal_gold',
    name: 'Royal Gold',
    description: 'Deep purple majesty with golden highlights',
    preview: '/assets/surfaces/surface_royal_gold.png',
  },
  ocean_breeze: {
    id: 'ocean_breeze',
    name: 'Ocean Breeze',
    description: 'Turquoise coastal vibes',
    preview: '/assets/surfaces/surface_ocean_breeze.png',
  },
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      selectedTheme: 'afro_heritage',
      availableThemes: ['afro_heritage', 'neon_arcade', 'royal_gold', 'ocean_breeze'],

      setTheme: theme => {
        // Validate theme before setting
        if (themeData[theme]) {
          set({ selectedTheme: theme })
        }
      },

      getThemeInfo: theme => {
        return themeData[theme]
      },

      getThemePath: () => {
        const currentTheme = get().selectedTheme
        return `/assets/surfaces/surface_${currentTheme}.png`
      },

      resetTheme: () => {
        set({ selectedTheme: 'afro_heritage' })
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
