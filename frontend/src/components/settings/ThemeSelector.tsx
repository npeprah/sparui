import { useState } from 'react'
import { cn } from '../../utils/cn'
import { Button } from '../ui'
import { type ThemeName } from '../../store/themeStore'

interface ThemeSelectorProps {
  selectedTheme: ThemeName
  onSelect: (theme: ThemeName) => void
  className?: string
  showApplyButton?: boolean
}

const themes = [
  {
    id: 'afro_heritage' as ThemeName,
    name: 'Afro Heritage',
    description: 'Traditional Kente patterns with gold accents',
    preview: '/assets/surfaces/surface_afro_heritage.png',
  },
  {
    id: 'neon_arcade' as ThemeName,
    name: 'Neon Arcade',
    description: 'Vibrant neon glow with rainbow energy',
    preview: '/assets/surfaces/surface_neon_arcade.png',
  },
  {
    id: 'royal_gold' as ThemeName,
    name: 'Royal Gold',
    description: 'Deep purple majesty with golden highlights',
    preview: '/assets/surfaces/surface_royal_gold.png',
  },
  {
    id: 'ocean_breeze' as ThemeName,
    name: 'Ocean Breeze',
    description: 'Turquoise coastal vibes',
    preview: '/assets/surfaces/surface_ocean_breeze.png',
  },
]

export function ThemeSelector({
  selectedTheme,
  onSelect,
  className = '',
  showApplyButton = false,
}: ThemeSelectorProps) {
  const [previewTheme, setPreviewTheme] = useState<ThemeName>(selectedTheme)

  const handleThemeClick = (theme: ThemeName) => {
    if (showApplyButton) {
      setPreviewTheme(theme)
    } else {
      onSelect(theme)
    }
  }

  const handleApply = () => {
    onSelect(previewTheme)
  }

  return (
    <div data-testid="theme-selector" className={cn('space-y-4', className)}>
      <h2 className="text-2xl font-bold text-gold text-center">
        Choose Your Theme
      </h2>

      <div
        data-testid="theme-grid"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {themes.map((theme) => (
          <div
            key={theme.id}
            data-testid={`theme-item-${theme.id}`}
            className={cn(
              'flex flex-col space-y-2 p-3 rounded-lg',
              'bg-gray-800/50 border-2 transition-all duration-200',
              'hover:bg-gray-700/50 hover:scale-105 hover:shadow-lg',
              'cursor-pointer',
              (showApplyButton ? previewTheme : selectedTheme) === theme.id
                ? 'border-gold shadow-gold/50'
                : 'border-gray-700 hover:border-gray-600'
            )}
            onClick={() => handleThemeClick(theme.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleThemeClick(theme.id)
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Select ${theme.name} - ${theme.description}`}
          >
            <div
              data-testid={`theme-preview-${theme.id}`}
              className="relative w-full h-32 overflow-hidden rounded-md"
            >
              <img
                src={theme.preview}
                alt={`${theme.name} theme preview`}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-white">
                {theme.name}
              </h3>
              <p className="text-xs text-gray-400">
                {theme.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {showApplyButton && (
        <div className="flex justify-center mt-4">
          <Button
            variant="primary"
            onClick={handleApply}
            disabled={previewTheme === selectedTheme}
          >
            Apply Theme
          </Button>
        </div>
      )}
    </div>
  )
}