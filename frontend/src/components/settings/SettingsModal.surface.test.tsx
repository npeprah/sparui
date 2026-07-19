import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsModal } from './SettingsModal'
import { useUIStore } from '../../store/uiStore'
import { useThemeStore } from '../../store/themeStore'
import { usePlayerStore } from '../../store/playerStore'

// Mock the stores
vi.mock('../../store/uiStore', () => ({
  useUIStore: vi.fn(),
}))

vi.mock('../../store/themeStore', () => ({
  useThemeStore: vi.fn(),
}))

vi.mock('../../store/playerStore', () => ({
  usePlayerStore: vi.fn(),
}))

// Mock Avatar component
vi.mock('../avatar', () => ({
  Avatar: ({ avatarId, size, isSelected, onClick }: any) => (
    <div
      data-testid={`avatar-${avatarId}`}
      className={`avatar ${size} ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(avatarId)}
    >
      Avatar {avatarId}
    </div>
  ),
}))

const SWATCHES: Record<string, { base: string; ink: string; accent: string; pop: string }> = {
  warm_heritage: { base: '#f5e6c8', ink: '#14100c', accent: '#ffd700', pop: '#e4002b' },
  comic: { base: '#ffd400', ink: '#14100c', accent: '#ff5a1f', pop: '#ffffff' },
  neon: { base: '#0d0221', ink: '#00f5ff', accent: '#ff006e', pop: '#2a0a4a' },
}

describe('SettingsModal - Palette Selection', () => {
  const mockCloseSettings = vi.fn()
  const mockSetTheme = vi.fn()
  const mockToggleSound = vi.fn()
  const mockToggleMusic = vi.fn()
  const mockSetPlayerName = vi.fn()
  const mockSetAvatar = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useUIStore as any).mockReturnValue({
      isSettingsOpen: true,
      closeSettings: mockCloseSettings,
      soundEnabled: true,
      musicEnabled: true,
      toggleSound: mockToggleSound,
      toggleMusic: mockToggleMusic,
    })
    ;(useThemeStore as any).mockReturnValue({
      selectedTheme: 'warm_heritage',
      availableThemes: ['warm_heritage', 'comic', 'neon'],
      setTheme: mockSetTheme,
      getThemeInfo: (theme: string) => ({
        id: theme,
        name: theme
          .split('_')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        description: `Description for ${theme}`,
        swatch: SWATCHES[theme],
      }),
    })
    ;(usePlayerStore as any).mockReturnValue({
      playerName: 'TestPlayer',
      avatar: 'avatar_01',
      setPlayerName: mockSetPlayerName,
      setAvatar: mockSetAvatar,
    })
  })

  describe('Palette Section', () => {
    it('should display the palette section', () => {
      render(<SettingsModal />)
      expect(screen.getByText('Table Palette')).toBeInTheDocument()
    })

    it('should display all 3 canonical palette options', () => {
      render(<SettingsModal />)

      expect(screen.getByRole('button', { name: /Warm Heritage/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Comic$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Neon$/i })).toBeInTheDocument()
    })

    it('should render a swatch preview per palette (no image assets)', () => {
      render(<SettingsModal />)

      expect(screen.getByTestId('palette-swatch-warm_heritage')).toBeInTheDocument()
      expect(screen.getByTestId('palette-swatch-comic')).toBeInTheDocument()
      expect(screen.getByTestId('palette-swatch-neon')).toBeInTheDocument()

      // No surface images are used anymore.
      const surfaceImages = screen
        .queryAllByRole('img')
        .filter(img => img.getAttribute('src')?.includes('/assets/surfaces/'))
      expect(surfaceImages).toHaveLength(0)
    })

    it('should highlight the currently selected palette', () => {
      render(<SettingsModal />)

      const button = screen.getByRole('button', { name: /Warm Heritage/i })
      expect(button.querySelector('div')).toHaveClass('ring-gold')
    })

    it('should update local state when a different palette is clicked', () => {
      render(<SettingsModal />)

      const neonButton = screen.getByRole('button', { name: /^Neon$/i })
      fireEvent.click(neonButton)

      expect(neonButton.querySelector('div')).toHaveClass('ring-gold')
    })

    it('should not immediately call setTheme before saving', () => {
      render(<SettingsModal />)

      fireEvent.click(screen.getByRole('button', { name: /^Comic$/i }))
      expect(mockSetTheme).not.toHaveBeenCalled()
    })

    it('should call setTheme with selected palette when Save is clicked', () => {
      render(<SettingsModal />)

      fireEvent.click(screen.getByRole('button', { name: /^Neon$/i }))
      fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }))

      expect(mockSetTheme).toHaveBeenCalledWith('neon')
    })

    it('should not call setTheme when Cancel is clicked', () => {
      render(<SettingsModal />)

      fireEvent.click(screen.getByRole('button', { name: /^Comic$/i }))
      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))

      expect(mockSetTheme).not.toHaveBeenCalled()
    })

    it('should reset local selection when modal reopens', () => {
      const { rerender } = render(<SettingsModal />)

      fireEvent.click(screen.getByRole('button', { name: /^Comic$/i }))
      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
      ;(useUIStore as any).mockReturnValue({
        isSettingsOpen: false,
        closeSettings: mockCloseSettings,
      })
      rerender(<SettingsModal />)
      ;(useUIStore as any).mockReturnValue({
        isSettingsOpen: true,
        closeSettings: mockCloseSettings,
        soundEnabled: true,
        musicEnabled: true,
        toggleSound: mockToggleSound,
        toggleMusic: mockToggleMusic,
      })
      rerender(<SettingsModal />)

      const warmButton = screen.getByRole('button', { name: /Warm Heritage/i })
      expect(warmButton.querySelector('div')).toHaveClass('ring-gold')
    })

    it('should display a name for each palette', () => {
      render(<SettingsModal />)

      const grid = screen.getByTestId('palette-grid')
      const names = grid.querySelectorAll('p')
      expect(names.length).toBe(3)
      names.forEach(n => expect(n.textContent).toBeTruthy())
    })

    it('should select palette on Enter key press', () => {
      render(<SettingsModal />)

      const comicButton = screen.getByRole('button', { name: /^Comic$/i })
      comicButton.focus()
      fireEvent.keyDown(comicButton, { key: 'Enter' })

      expect(comicButton.querySelector('div')).toHaveClass('ring-gold')
    })

    it('should select palette on Space key press', () => {
      render(<SettingsModal />)

      const neonButton = screen.getByRole('button', { name: /^Neon$/i })
      neonButton.focus()
      fireEvent.keyDown(neonButton, { key: ' ' })

      expect(neonButton.querySelector('div')).toHaveClass('ring-gold')
    })

    it('should display palettes in a 3-column grid', () => {
      render(<SettingsModal />)

      const grid = screen.getByTestId('palette-grid')
      expect(grid).toHaveClass('grid-cols-3')
    })

    it('should show checkmark icon on selected palette', () => {
      render(<SettingsModal />)

      const warmButton = screen.getByRole('button', { name: /Warm Heritage/i })
      expect(warmButton.querySelector('[data-testid="check-icon"]')).toBeInTheDocument()
    })
  })

  describe('Integration with Other Settings', () => {
    it('should save all settings together when Save is clicked', () => {
      render(<SettingsModal />)

      const nameInput = screen.getByLabelText('Player Name')
      fireEvent.change(nameInput, { target: { value: 'NewName' } })

      fireEvent.click(screen.getByRole('button', { name: /^Comic$/i }))
      fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }))

      expect(mockSetPlayerName).toHaveBeenCalledWith('NewName')
      expect(mockSetTheme).toHaveBeenCalledWith('comic')
    })

    it('should not save any settings when Cancel is clicked', () => {
      render(<SettingsModal />)

      const nameInput = screen.getByLabelText('Player Name')
      fireEvent.change(nameInput, { target: { value: 'NewName' } })

      fireEvent.click(screen.getByRole('button', { name: /^Comic$/i }))
      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))

      expect(mockSetPlayerName).not.toHaveBeenCalled()
      expect(mockSetTheme).not.toHaveBeenCalled()
    })
  })
})
