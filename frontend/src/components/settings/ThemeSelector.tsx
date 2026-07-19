import { useState } from 'react'
import { cn } from '../../utils/cn'
import { Button } from '../ui'
import { useThemeStore, type ThemeName } from '../../store/themeStore'

interface ThemeSelectorProps {
  selectedTheme: ThemeName
  onSelect: (theme: ThemeName) => void
  className?: string
  showApplyButton?: boolean
}

export function ThemeSelector({
  selectedTheme,
  onSelect,
  className = '',
  showApplyButton = false,
}: ThemeSelectorProps) {
  const { availableThemes, getThemeInfo } = useThemeStore()
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
      <h2 className="text-2xl font-bold text-gold text-center">Choose Your Palette</h2>

      <div data-testid="theme-grid" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {availableThemes.map(themeName => {
          const theme = getThemeInfo(themeName)
          const swatchColors = [
            theme.swatch.base,
            theme.swatch.ink,
            theme.swatch.accent,
            theme.swatch.pop,
          ]

          return (
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
              onKeyDown={e => {
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
                role="img"
                aria-label={`${theme.name} palette preview`}
                className="relative flex w-full h-32 overflow-hidden rounded-md"
              >
                {swatchColors.map((color, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                ))}
              </div>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-white">{theme.name}</h3>
                <p className="text-xs text-gray-400">{theme.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {showApplyButton && (
        <div className="flex justify-center mt-4">
          <Button variant="primary" onClick={handleApply} disabled={previewTheme === selectedTheme}>
            Apply Palette
          </Button>
        </div>
      )}
    </div>
  )
}
