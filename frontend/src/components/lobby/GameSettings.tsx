import type { LobbySettings, SurfaceTheme } from '../../store/types'

interface GameSettingsProps {
  settings: LobbySettings
  isHost: boolean
  onSettingsChange: (settings: Partial<LobbySettings>) => void
}

const POINTS_OPTIONS = [10, 15, 21] as const
const SURFACE_THEMES: { value: SurfaceTheme; label: string }[] = [
  { value: 'poker', label: 'Poker Table' },
  { value: 'street', label: 'Street Court' },
  { value: 'wooden', label: 'Wooden Deck' },
  { value: 'neon', label: 'Neon Lounge' },
  { value: 'beach', label: 'Beach Paradise' },
]

export function GameSettings({ settings, isHost, onSettingsChange }: GameSettingsProps) {
  const handlePointsChange = (points: 10 | 15 | 21) => {
    if (isHost) {
      onSettingsChange({ pointsToWin: points })
    }
  }

  const handleThemeChange = (theme: SurfaceTheme) => {
    if (isHost) {
      onSettingsChange({ surfaceTheme: theme })
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 md:p-6 mb-4 md:mb-6">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-bold text-white">Game Settings</h2>
        {!isHost && (
          <span className="text-xs text-gray-500 bg-gray-700 px-2 md:px-3 py-1 rounded-full">
            Host Only
          </span>
        )}
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Points to Win */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2 md:mb-3">
            Points to Win
          </label>
          <div className="flex gap-2 md:gap-3">
            {POINTS_OPTIONS.map(points => (
              <button
                key={points}
                onClick={() => handlePointsChange(points)}
                disabled={!isHost}
                className={`flex-1 px-3 md:px-4 py-2 md:py-3 rounded-lg font-bold text-base md:text-lg transition-all min-h-[48px] ${
                  settings.pointsToWin === points
                    ? 'bg-fireRed text-white shadow-lg scale-105'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } ${!isHost ? 'cursor-not-allowed opacity-60' : 'hover:scale-105'}`}
              >
                {points}
              </button>
            ))}
          </div>
        </div>

        {/* Surface Theme */}
        <div>
          <label
            htmlFor="surface-theme"
            className="block text-xs md:text-sm font-medium text-gray-300 mb-2 md:mb-3"
          >
            Surface Theme
          </label>
          <select
            id="surface-theme"
            value={settings.surfaceTheme}
            onChange={e => handleThemeChange(e.target.value as SurfaceTheme)}
            disabled={!isHost}
            className={`w-full px-3 md:px-4 py-2 md:py-3 bg-gray-700 text-white text-sm md:text-base rounded-lg border-2 border-transparent focus:border-iceBlue focus:outline-none transition-all min-h-[48px] ${
              !isHost ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-600'
            }`}
          >
            {SURFACE_THEMES.map(theme => (
              <option key={theme.value} value={theme.value}>
                {theme.label}
              </option>
            ))}
          </select>
        </div>

        {/* Max Players Display */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2 md:mb-3">
            Max Players
          </label>
          <div className="px-3 md:px-4 py-2 md:py-3 bg-gray-700 rounded-lg min-h-[48px] flex items-center">
            <span className="text-white font-bold text-base md:text-lg">
              {settings.maxPlayers} Players
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
