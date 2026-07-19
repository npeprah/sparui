import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../../store/uiStore'
import { useThemeStore } from '../../store/themeStore'
import { X, Volume2, Music, Check } from 'lucide-react'

export function SettingsModal() {
  const {
    isSettingsOpen,
    closeSettings,
    soundEnabled,
    musicEnabled,
    masterVolume,
    sfxVolume,
    toggleSound,
    toggleMusic,
    setMasterVolume,
    setSfxVolume,
  } = useUIStore()

  const {
    selectedTheme,
    availableThemes,
    setTheme,
    getThemeInfo,
  } = useThemeStore()

  const modalRef = useRef<HTMLDivElement>(null)

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsOpen) {
        closeSettings()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isSettingsOpen, closeSettings])

  // Focus management
  useEffect(() => {
    if (isSettingsOpen && modalRef.current) {
      modalRef.current.focus()
    }
  }, [isSettingsOpen])

  if (!isSettingsOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          data-testid="modal-backdrop"
          className="absolute inset-0 bg-black/70 animate-fadeIn"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSettings}
        />

        {/* Modal Content */}
        <motion.div
          ref={modalRef}
          data-testid="modal-content"
          role="dialog"
          aria-label="Settings"
          tabIndex={-1}
          className="relative z-10 bg-gray-900 rounded-2xl p-6 md:p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-scaleIn"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Settings</h2>
            <button
              onClick={closeSettings}
              aria-label="Close settings"
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Surface Theme Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Table Surface</h3>
            <div
              data-testid="surface-grid"
              className="grid grid-cols-2 sm:grid-cols-2 gap-4"
            >
              {availableThemes.map((theme) => {
                const info = getThemeInfo(theme)
                const isSelected = selectedTheme === theme

                return (
                  <button
                    key={theme}
                    role="button"
                    aria-label={info.name}
                    onClick={() => {
                      if (!isSelected) {
                        setTheme(theme)
                      }
                    }}
                    className={`
                      surface-option relative group rounded-lg overflow-hidden transition-all duration-300
                      hover:scale-105 ${isSelected ? 'selected ring-4 ring-fireRed' : 'ring-2 ring-gray-700 hover:ring-gray-600'}
                    `}
                  >
                    <img
                      src={info.preview}
                      alt={info.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-semibold text-sm">{info.name}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-fireRed rounded-full p-1">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sound Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Audio</h3>

            {/* Sound Effects Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-gray-400" />
                <span className="text-white">Sound Effects</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Sound Effects"
                  aria-checked={soundEnabled}
                  checked={soundEnabled}
                  onChange={toggleSound}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-fireRed/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fireRed"></div>
              </label>
            </div>

            {/* Background Music Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Music className="w-5 h-5 text-gray-400" />
                <span className="text-white">Background Music</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Background Music"
                  aria-checked={musicEnabled}
                  checked={musicEnabled}
                  onChange={toggleMusic}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-fireRed/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fireRed"></div>
              </label>
            </div>

            {/* Master Volume */}
            <div>
              <label htmlFor="master-volume" className="block text-white mb-2">
                Master Volume
              </label>
              <input
                id="master-volume"
                type="range"
                aria-label="Master Volume"
                min="0"
                max="1"
                step="0.1"
                value={masterVolume}
                onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>{Math.round(masterVolume * 100)}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* SFX Volume */}
            <div>
              <label htmlFor="sfx-volume" className="block text-white mb-2">
                Effects Volume
              </label>
              <input
                id="sfx-volume"
                type="range"
                aria-label="Effects Volume"
                min="0"
                max="1"
                step="0.1"
                value={sfxVolume}
                onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>{Math.round(sfxVolume * 100)}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// Add required styles to your global CSS or Tailwind config
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    background: #FF4500;
    cursor: pointer;
    border-radius: 50%;
  }

  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #FF4500;
    cursor: pointer;
    border-radius: 50%;
    border: none;
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }

  .animate-scaleIn {
    animation: scaleIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scaleIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`