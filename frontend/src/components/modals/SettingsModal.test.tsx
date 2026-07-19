import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SettingsModal } from './SettingsModal'
import { useUIStore } from '../../store/uiStore'
import { useThemeStore } from '../../store/themeStore'

// Mock the stores
vi.mock('../../store/uiStore', () => ({
  useUIStore: vi.fn(),
}))

vi.mock('../../store/themeStore', () => ({
  useThemeStore: vi.fn(),
}))

describe('SettingsModal', () => {
  const mockCloseSettings = vi.fn()
  const mockToggleSound = vi.fn()
  const mockToggleMusic = vi.fn()
  const mockSetMasterVolume = vi.fn()
  const mockSetSfxVolume = vi.fn()
  const mockSetTheme = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock returns
    ;(useUIStore as any).mockReturnValue({
      isSettingsOpen: true,
      closeSettings: mockCloseSettings,
      soundEnabled: true,
      musicEnabled: true,
      masterVolume: 1.0,
      sfxVolume: 1.0,
      toggleSound: mockToggleSound,
      toggleMusic: mockToggleMusic,
      setMasterVolume: mockSetMasterVolume,
      setSfxVolume: mockSetSfxVolume,
    })

    ;(useThemeStore as any).mockReturnValue({
      selectedTheme: 'afro_heritage',
      availableThemes: ['afro_heritage', 'neon_arcade', 'royal_gold', 'ocean_breeze'],
      setTheme: mockSetTheme,
      getThemeInfo: (theme: string) => ({
        id: theme,
        name: theme.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        description: `Description for ${theme}`,
        preview: `/assets/surfaces/surface_${theme}.png`,
      }),
    })
  })

  describe('Modal Visibility', () => {
    it('should render when isSettingsOpen is true', () => {
      render(<SettingsModal />)
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('should not render when isSettingsOpen is false', () => {
      ;(useUIStore as any).mockReturnValue({
        isSettingsOpen: false,
        closeSettings: mockCloseSettings,
      })

      const { container } = render(<SettingsModal />)
      expect(container.firstChild).toBeNull()
    })

    it('should call closeSettings when close button is clicked', () => {
      render(<SettingsModal />)
      const closeButton = screen.getByLabelText('Close settings')
      fireEvent.click(closeButton)

      expect(mockCloseSettings).toHaveBeenCalledTimes(1)
    })

    it('should call closeSettings when clicking outside modal', () => {
      render(<SettingsModal />)
      const backdrop = screen.getByTestId('modal-backdrop')
      fireEvent.click(backdrop)

      expect(mockCloseSettings).toHaveBeenCalledTimes(1)
    })

    it('should not close when clicking inside modal content', () => {
      render(<SettingsModal />)
      const modalContent = screen.getByTestId('modal-content')
      fireEvent.click(modalContent)

      expect(mockCloseSettings).not.toHaveBeenCalled()
    })
  })

  describe('Surface Theme Selection', () => {
    it('should display all 4 surface theme options', () => {
      render(<SettingsModal />)

      expect(screen.getByAltText('Afro Heritage')).toBeInTheDocument()
      expect(screen.getByAltText('Neon Arcade')).toBeInTheDocument()
      expect(screen.getByAltText('Royal Gold')).toBeInTheDocument()
      expect(screen.getByAltText('Ocean Breeze')).toBeInTheDocument()
    })

    it('should show surface previews as images', () => {
      render(<SettingsModal />)

      const previews = screen.getAllByRole('img')
      const surfacePreviews = previews.filter(img =>
        img.getAttribute('src')?.includes('/assets/surfaces/')
      )

      expect(surfacePreviews).toHaveLength(4)
    })

    it('should highlight the currently selected theme', () => {
      render(<SettingsModal />)

      const afroHeritageButton = screen.getByRole('button', { name: /Afro Heritage/i })
      expect(afroHeritageButton).toHaveClass('selected')
    })

    it('should call setTheme when a different surface is clicked', () => {
      render(<SettingsModal />)

      const neonArcadeButton = screen.getByRole('button', { name: /Neon Arcade/i })
      fireEvent.click(neonArcadeButton)

      expect(mockSetTheme).toHaveBeenCalledWith('neon_arcade')
    })

    it('should not call setTheme when clicking already selected surface', () => {
      render(<SettingsModal />)

      const afroHeritageButton = screen.getByRole('button', { name: /Afro Heritage/i })
      fireEvent.click(afroHeritageButton)

      expect(mockSetTheme).not.toHaveBeenCalled()
    })

    it('should display surface names correctly', () => {
      render(<SettingsModal />)

      expect(screen.getByText('Afro Heritage')).toBeInTheDocument()
      expect(screen.getByText('Neon Arcade')).toBeInTheDocument()
      expect(screen.getByText('Royal Gold')).toBeInTheDocument()
      expect(screen.getByText('Ocean Breeze')).toBeInTheDocument()
    })

    it('should have a section title for surface themes', () => {
      render(<SettingsModal />)
      expect(screen.getByText('Table Surface')).toBeInTheDocument()
    })

    it('should display surfaces in a 2x2 grid on desktop', () => {
      render(<SettingsModal />)

      const surfaceGrid = screen.getByTestId('surface-grid')
      expect(surfaceGrid).toHaveClass('grid-cols-2')
    })

    it('should provide visual feedback on hover', () => {
      render(<SettingsModal />)

      const royalGoldButton = screen.getByRole('button', { name: /Royal Gold/i })
      expect(royalGoldButton).toHaveClass('hover:scale-105')
    })
  })

  describe('Sound Settings', () => {
    it('should display sound toggle', () => {
      render(<SettingsModal />)
      expect(screen.getByText('Sound Effects')).toBeInTheDocument()
    })

    it('should display music toggle', () => {
      render(<SettingsModal />)
      expect(screen.getByText('Background Music')).toBeInTheDocument()
    })

    it('should toggle sound when sound switch is clicked', () => {
      render(<SettingsModal />)

      const soundToggle = screen.getByRole('switch', { name: /Sound Effects/i })
      fireEvent.click(soundToggle)

      expect(mockToggleSound).toHaveBeenCalledTimes(1)
    })

    it('should toggle music when music switch is clicked', () => {
      render(<SettingsModal />)

      const musicToggle = screen.getByRole('switch', { name: /Background Music/i })
      fireEvent.click(musicToggle)

      expect(mockToggleMusic).toHaveBeenCalledTimes(1)
    })

    it('should show sound as enabled when soundEnabled is true', () => {
      render(<SettingsModal />)

      const soundToggle = screen.getByRole('switch', { name: /Sound Effects/i })
      expect(soundToggle).toHaveAttribute('aria-checked', 'true')
    })

    it('should show music as enabled when musicEnabled is true', () => {
      render(<SettingsModal />)

      const musicToggle = screen.getByRole('switch', { name: /Background Music/i })
      expect(musicToggle).toHaveAttribute('aria-checked', 'true')
    })

    it('should display master volume slider', () => {
      render(<SettingsModal />)
      expect(screen.getByLabelText('Master Volume')).toBeInTheDocument()
    })

    it('should display SFX volume slider', () => {
      render(<SettingsModal />)
      expect(screen.getByLabelText('Effects Volume')).toBeInTheDocument()
    })

    it('should update master volume when slider changes', () => {
      render(<SettingsModal />)

      const masterVolumeSlider = screen.getByLabelText('Master Volume')
      fireEvent.change(masterVolumeSlider, { target: { value: '0.5' } })

      expect(mockSetMasterVolume).toHaveBeenCalledWith(0.5)
    })

    it('should update SFX volume when slider changes', () => {
      render(<SettingsModal />)

      const sfxVolumeSlider = screen.getByLabelText('Effects Volume')
      fireEvent.change(sfxVolumeSlider, { target: { value: '0.7' } })

      expect(mockSetSfxVolume).toHaveBeenCalledWith(0.7)
    })

    it('should display current volume values', () => {
      render(<SettingsModal />)

      const masterVolumeSlider = screen.getByLabelText('Master Volume') as HTMLInputElement
      const sfxVolumeSlider = screen.getByLabelText('Effects Volume') as HTMLInputElement

      expect(masterVolumeSlider.value).toBe('1')
      expect(sfxVolumeSlider.value).toBe('1')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<SettingsModal />)

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Settings')
      expect(screen.getByLabelText('Close settings')).toBeInTheDocument()
    })

    it('should be keyboard navigable', () => {
      render(<SettingsModal />)

      const firstSurfaceButton = screen.getByRole('button', { name: /Afro Heritage/i })
      firstSurfaceButton.focus()

      expect(document.activeElement).toBe(firstSurfaceButton)
    })

    it('should have proper focus management', () => {
      render(<SettingsModal />)

      // Modal should trap focus
      const modalContent = screen.getByTestId('modal-content')
      expect(modalContent).toHaveAttribute('tabIndex', '-1')
    })

    it('should close on Escape key press', () => {
      render(<SettingsModal />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockCloseSettings).toHaveBeenCalledTimes(1)
    })
  })

  describe('Responsive Design', () => {
    it('should adapt surface grid for mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<SettingsModal />)

      const surfaceGrid = screen.getByTestId('surface-grid')
      expect(surfaceGrid).toHaveClass('grid-cols-2', 'sm:grid-cols-2')
    })

    it('should have scrollable content on small screens', () => {
      render(<SettingsModal />)

      const modalContent = screen.getByTestId('modal-content')
      expect(modalContent).toHaveClass('overflow-y-auto')
    })
  })

  describe('Animation and Transitions', () => {
    it('should have fade-in animation class', () => {
      render(<SettingsModal />)

      const modalBackdrop = screen.getByTestId('modal-backdrop')
      expect(modalBackdrop).toHaveClass('animate-fadeIn')
    })

    it('should have scale animation for modal content', () => {
      render(<SettingsModal />)

      const modalContent = screen.getByTestId('modal-content')
      expect(modalContent).toHaveClass('animate-scaleIn')
    })

    it('should have transition on surface hover', () => {
      render(<SettingsModal />)

      const surfaceButtons = screen.getAllByRole('button').filter(btn =>
        btn.className.includes('surface-option')
      )

      surfaceButtons.forEach(button => {
        expect(button).toHaveClass('transition-all')
      })
    })
  })
})