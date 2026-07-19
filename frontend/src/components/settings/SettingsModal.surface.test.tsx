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

describe('SettingsModal - Surface Selection', () => {
  const mockCloseSettings = vi.fn()
  const mockSetTheme = vi.fn()
  const mockToggleSound = vi.fn()
  const mockToggleMusic = vi.fn()
  const mockSetPlayerName = vi.fn()
  const mockSetAvatar = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock returns for UIStore
    ;(useUIStore as any).mockReturnValue({
      isSettingsOpen: true,
      closeSettings: mockCloseSettings,
      soundEnabled: true,
      musicEnabled: true,
      toggleSound: mockToggleSound,
      toggleMusic: mockToggleMusic,
    })

    // Setup default mock returns for ThemeStore
    ;(useThemeStore as any).mockReturnValue({
      selectedTheme: 'afro_heritage',
      availableThemes: ['afro_heritage', 'neon_arcade', 'royal_gold', 'ocean_breeze'],
      setTheme: mockSetTheme,
      getThemeInfo: (theme: string) => ({
        id: theme,
        name: theme
          .split('_')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        description: `Description for ${theme}`,
        preview: `/assets/surfaces/surface_${theme}.png`,
      }),
    })

    // Setup default mock returns for PlayerStore
    ;(usePlayerStore as any).mockReturnValue({
      playerName: 'TestPlayer',
      avatar: 'avatar_01',
      setPlayerName: mockSetPlayerName,
      setAvatar: mockSetAvatar,
    })
  })

  describe('Surface Theme Section', () => {
    it('should display surface theme section', () => {
      render(<SettingsModal />)
      expect(screen.getByText('Table Surface')).toBeInTheDocument()
    })

    it('should display all 4 surface theme options', () => {
      render(<SettingsModal />)

      expect(screen.getByAltText('Afro Heritage')).toBeInTheDocument()
      expect(screen.getByAltText('Neon Arcade')).toBeInTheDocument()
      expect(screen.getByAltText('Royal Gold')).toBeInTheDocument()
      expect(screen.getByAltText('Ocean Breeze')).toBeInTheDocument()
    })

    it('should show surface preview images', () => {
      render(<SettingsModal />)

      const previews = screen
        .getAllByRole('img')
        .filter(img => img.getAttribute('src')?.includes('/assets/surfaces/'))

      expect(previews).toHaveLength(4)
      expect(previews[0]).toHaveAttribute('src', '/assets/surfaces/surface_afro_heritage.png')
      expect(previews[1]).toHaveAttribute('src', '/assets/surfaces/surface_neon_arcade.png')
      expect(previews[2]).toHaveAttribute('src', '/assets/surfaces/surface_royal_gold.png')
      expect(previews[3]).toHaveAttribute('src', '/assets/surfaces/surface_ocean_breeze.png')
    })

    it('should highlight the currently selected theme', () => {
      render(<SettingsModal />)

      const afroHeritageButton = screen.getByRole('button', { name: /Afro Heritage/i })
      const buttonContainer = afroHeritageButton.querySelector('div')
      expect(buttonContainer).toHaveClass('ring-gold')
    })

    it('should update local state when a different surface is clicked', () => {
      render(<SettingsModal />)

      const neonArcadeButton = screen.getByRole('button', { name: /Neon Arcade/i })
      fireEvent.click(neonArcadeButton)

      // Check that the selection is visually updated (class change)
      const buttonContainer = neonArcadeButton.querySelector('div')
      expect(buttonContainer).toHaveClass('ring-gold')
    })

    it('should not immediately call setTheme before saving', () => {
      render(<SettingsModal />)

      const royalGoldButton = screen.getByRole('button', { name: /Royal Gold/i })
      fireEvent.click(royalGoldButton)

      // Theme should not be set until Save is clicked
      expect(mockSetTheme).not.toHaveBeenCalled()
    })

    it('should call setTheme with selected surface when Save is clicked', () => {
      render(<SettingsModal />)

      // Select a new surface
      const oceanBreezeButton = screen.getByRole('button', { name: /Ocean Breeze/i })
      fireEvent.click(oceanBreezeButton)

      // Click Save
      const saveButton = screen.getByRole('button', { name: /Save Settings/i })
      fireEvent.click(saveButton)

      // Verify setTheme was called with the new theme
      expect(mockSetTheme).toHaveBeenCalledWith('ocean_breeze')
    })

    it('should not call setTheme when Cancel is clicked', () => {
      render(<SettingsModal />)

      // Select a new surface
      const neonArcadeButton = screen.getByRole('button', { name: /Neon Arcade/i })
      fireEvent.click(neonArcadeButton)

      // Click Cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      // Verify setTheme was NOT called
      expect(mockSetTheme).not.toHaveBeenCalled()
    })

    it('should reset local selection when modal reopens', () => {
      const { rerender } = render(<SettingsModal />)

      // Select a new surface
      const neonArcadeButton = screen.getByRole('button', { name: /Neon Arcade/i })
      fireEvent.click(neonArcadeButton)

      // Close without saving
      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      // Simulate modal closing and reopening
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

      // Original selection should be shown
      const afroHeritageButton = screen.getByRole('button', { name: /Afro Heritage/i })
      const buttonContainer = afroHeritageButton.querySelector('div')
      expect(buttonContainer).toHaveClass('ring-gold')
    })

    it('should display surface theme descriptions', () => {
      render(<SettingsModal />)

      const surfaceButtons = screen
        .getAllByRole('button')
        .filter(btn => btn.querySelector('img[src*="/assets/surfaces/"]'))

      surfaceButtons.forEach(button => {
        const surfaceName = button.querySelector('p')?.textContent
        expect(surfaceName).toBeTruthy()
      })
    })

    it('should have proper keyboard navigation for surface selection', () => {
      render(<SettingsModal />)

      const surfaceButtons = screen
        .getAllByRole('button')
        .filter(btn => btn.querySelector('img[src*="/assets/surfaces/"]'))

      // Each button should be focusable
      surfaceButtons.forEach(button => {
        button.focus()
        expect(document.activeElement).toBe(button)
      })
    })

    it('should select surface on Enter key press', () => {
      render(<SettingsModal />)

      const royalGoldButton = screen.getByRole('button', { name: /Royal Gold/i })
      royalGoldButton.focus()

      fireEvent.keyDown(royalGoldButton, { key: 'Enter' })

      const buttonContainer = royalGoldButton.querySelector('div')
      expect(buttonContainer).toHaveClass('ring-gold')
    })

    it('should select surface on Space key press', () => {
      render(<SettingsModal />)

      const oceanBreezeButton = screen.getByRole('button', { name: /Ocean Breeze/i })
      oceanBreezeButton.focus()

      fireEvent.keyDown(oceanBreezeButton, { key: ' ' })

      const buttonContainer = oceanBreezeButton.querySelector('div')
      expect(buttonContainer).toHaveClass('ring-gold')
    })

    it('should display surfaces in a 2x2 grid', () => {
      render(<SettingsModal />)

      const surfaceGrid = screen.getByTestId('surface-theme-grid')
      expect(surfaceGrid).toHaveClass('grid-cols-2')
    })

    it('should show checkmark icon on selected surface', () => {
      render(<SettingsModal />)

      const afroHeritageButton = screen.getByRole('button', { name: /Afro Heritage/i })
      const checkIcon = afroHeritageButton.querySelector('[data-testid="check-icon"]')

      expect(checkIcon).toBeInTheDocument()
    })

    it('should have hover effect on surface buttons', () => {
      render(<SettingsModal />)

      const surfaceButtons = screen
        .getAllByRole('button')
        .filter(btn => btn.querySelector('img[src*="/assets/surfaces/"]'))

      // At least one non-selected button should have hover effect
      const nonSelectedButtons = surfaceButtons.filter(button => {
        const buttonContainer = button.querySelector('div')
        return buttonContainer && !buttonContainer.className.includes('ring-gold')
      })

      expect(nonSelectedButtons.length).toBeGreaterThan(0)
      nonSelectedButtons.forEach(button => {
        const buttonContainer = button.querySelector('div')
        expect(buttonContainer?.className).toContain('hover:ring-gray-')
      })
    })
  })

  describe('Integration with Other Settings', () => {
    it('should save all settings together when Save is clicked', () => {
      render(<SettingsModal />)

      // Change player name
      const nameInput = screen.getByLabelText('Player Name')
      fireEvent.change(nameInput, { target: { value: 'NewName' } })

      // Select new surface
      const neonArcadeButton = screen.getByRole('button', { name: /Neon Arcade/i })
      fireEvent.click(neonArcadeButton)

      // Save all settings
      const saveButton = screen.getByRole('button', { name: /Save Settings/i })
      fireEvent.click(saveButton)

      expect(mockSetPlayerName).toHaveBeenCalledWith('NewName')
      expect(mockSetTheme).toHaveBeenCalledWith('neon_arcade')
    })

    it('should not save any settings when Cancel is clicked', () => {
      render(<SettingsModal />)

      // Change multiple settings
      const nameInput = screen.getByLabelText('Player Name')
      fireEvent.change(nameInput, { target: { value: 'NewName' } })

      const neonArcadeButton = screen.getByRole('button', { name: /Neon Arcade/i })
      fireEvent.click(neonArcadeButton)

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      expect(mockSetPlayerName).not.toHaveBeenCalled()
      expect(mockSetTheme).not.toHaveBeenCalled()
    })
  })
})
