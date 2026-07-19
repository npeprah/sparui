import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '../../store/playerStore'
import { useUIStore } from '../../store/uiStore'
import { useThemeStore } from '../../store/themeStore'
import { Avatar } from '../avatar'
import { Button } from '../ui'

const avatarOptions = [
  { id: 1, name: 'Kofi', description: 'Confident Leader' },
  { id: 2, name: 'Ama', description: 'Cool Strategist' },
  { id: 3, name: 'Kwame', description: 'Playful Challenger' },
  { id: 4, name: 'Yaa', description: 'Fierce Competitor' },
  { id: 5, name: 'Adjoa', description: 'Wise Veteran' },
]

export function SettingsModal() {
  const { isSettingsOpen, closeSettings, soundEnabled, musicEnabled, toggleSound, toggleMusic } =
    useUIStore()

  const { playerName, avatar, setPlayerName, setAvatar } = usePlayerStore()

  const { selectedTheme, availableThemes, setTheme, getThemeInfo } = useThemeStore()

  const [localPlayerName, setLocalPlayerName] = useState(playerName)
  const [localAvatar, setLocalAvatar] = useState(avatar)
  const [localTheme, setLocalTheme] = useState(selectedTheme)
  const avatarRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    setLocalPlayerName(playerName)
    setLocalAvatar(avatar)
    setLocalTheme(selectedTheme)
  }, [playerName, avatar, selectedTheme, isSettingsOpen])

  const handleSave = () => {
    const trimmedName = localPlayerName.trim()
    if (trimmedName) {
      setPlayerName(trimmedName)
    }
    setAvatar(localAvatar)
    setTheme(localTheme)
    closeSettings()
  }

  const handleAvatarSelect = (avatarId: number) => {
    setLocalAvatar(`avatar_0${avatarId}`)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeSettings()
      return
    }

    // Arrow key navigation for avatars
    if (event.target instanceof HTMLElement && event.target.dataset.avatarIndex) {
      const currentIndex = parseInt(event.target.dataset.avatarIndex)

      let newIndex = currentIndex
      switch (event.key) {
        case 'ArrowRight':
          newIndex = Math.min(currentIndex + 1, avatarOptions.length - 1)
          break
        case 'ArrowLeft':
          newIndex = Math.max(currentIndex - 1, 0)
          break
        case 'ArrowDown':
          newIndex = Math.min(currentIndex + 3, avatarOptions.length - 1)
          break
        case 'ArrowUp':
          newIndex = Math.max(currentIndex - 3, 0)
          break
      }

      if (newIndex !== currentIndex && avatarRefs.current[newIndex]) {
        avatarRefs.current[newIndex]?.focus()
      }
    }
  }

  if (!isSettingsOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          data-testid="modal-backdrop"
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSettings}
        />

        {/* Modal */}
        <motion.div
          role="dialog"
          aria-label="Settings"
          className="relative bg-gray-900 rounded-lg shadow-2xl border border-gold/20 p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gold">Settings</h2>
            <button
              aria-label="Close settings"
              onClick={closeSettings}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Player Name */}
          <div className="mb-8">
            <label htmlFor="player-name" className="block text-sm font-medium text-gray-300 mb-2">
              Player Name
            </label>
            <input
              id="player-name"
              type="text"
              value={localPlayerName}
              onChange={e => setLocalPlayerName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-gold focus:outline-none"
              maxLength={20}
            />
          </div>

          {/* Avatar Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-300 mb-4">Select Avatar</h3>
            <div
              data-testid="avatar-selection-grid"
              className="grid grid-cols-3 sm:grid-cols-5 gap-4"
            >
              {avatarOptions.map((option, index) => {
                const avatarId = `avatar_0${option.id}`
                const isSelected = localAvatar === avatarId

                return (
                  <div
                    key={option.id}
                    ref={el => (avatarRefs.current[index] = el)}
                    data-avatar-index={index}
                    tabIndex={0}
                    className="flex flex-col items-center cursor-pointer group"
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleAvatarSelect(option.id)
                      }
                    }}
                  >
                    <Avatar
                      avatarId={option.id}
                      size="medium"
                      isSelected={isSelected}
                      onClick={handleAvatarSelect}
                    />
                    <span className="mt-2 text-xs text-gray-400 group-hover:text-white transition-colors text-center">
                      {option.description}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Surface Theme Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-300 mb-4">Table Surface</h3>
            <div data-testid="surface-theme-grid" className="grid grid-cols-2 gap-4">
              {availableThemes.map(theme => {
                const info = getThemeInfo(theme)
                const isSelected = localTheme === theme

                return (
                  <button
                    key={theme}
                    role="button"
                    aria-label={info.name}
                    onClick={() => setLocalTheme(theme)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setLocalTheme(theme)
                      }
                    }}
                    className="relative group"
                  >
                    <div
                      className={`
                        rounded-lg overflow-hidden transition-all duration-200
                        ${
                          isSelected
                            ? 'ring-4 ring-gold shadow-lg'
                            : 'ring-2 ring-gray-700 hover:ring-gray-500'
                        }
                      `}
                    >
                      <img
                        src={info.preview}
                        alt={info.name}
                        className="w-full h-24 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white font-medium text-sm">{info.name}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-gold rounded-full p-1">
                          <svg
                            data-testid="check-icon"
                            className="w-3 h-3 text-gray-900"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sound Settings */}
          <div className="mb-8 space-y-4">
            <h3 className="text-lg font-medium text-gray-300 mb-4">Audio</h3>

            <label htmlFor="sound-effects" className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                id="sound-effects"
                checked={soundEnabled}
                onChange={toggleSound}
                className="w-5 h-5 text-gold bg-gray-800 border-gray-600 rounded focus:ring-gold focus:ring-2"
              />
              <span className="text-gray-300">Sound Effects</span>
            </label>

            <label
              htmlFor="background-music"
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="checkbox"
                id="background-music"
                checked={musicEnabled}
                onChange={toggleMusic}
                className="w-5 h-5 text-gold bg-gray-800 border-gray-600 rounded focus:ring-gold focus:ring-2"
              />
              <span className="text-gray-300">Background Music</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={closeSettings}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
