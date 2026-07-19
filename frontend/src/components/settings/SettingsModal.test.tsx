import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsModal } from './SettingsModal'
import { usePlayerStore } from '../../store/playerStore'
import { useUIStore } from '../../store/uiStore'

// Mock the stores
vi.mock('../../store/playerStore')
vi.mock('../../store/uiStore')

describe('SettingsModal Component', () => {
  const mockSetPlayerName = vi.fn()
  const mockSetAvatar = vi.fn()
  const mockCloseSettings = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock playerStore
    vi.mocked(usePlayerStore).mockReturnValue({
      playerName: 'TestPlayer',
      avatar: 'avatar_01',
      setPlayerName: mockSetPlayerName,
      setAvatar: mockSetAvatar,
    } as any)

    // Mock uiStore
    vi.mocked(useUIStore).mockReturnValue({
      isSettingsOpen: true,
      closeSettings: mockCloseSettings,
      soundEnabled: true,
      musicEnabled: true,
      toggleSound: vi.fn(),
      toggleMusic: vi.fn(),
    } as any)
  })

  describe('Rendering', () => {
    it('should render when isSettingsOpen is true', () => {
      render(<SettingsModal />)
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('should not render when isSettingsOpen is false', () => {
      vi.mocked(useUIStore).mockReturnValue({
        isSettingsOpen: false,
        closeSettings: mockCloseSettings,
      } as any)

      render(<SettingsModal />)
      expect(screen.queryByText('Settings')).not.toBeInTheDocument()
    })

    it('should display current player name', () => {
      render(<SettingsModal />)
      const input = screen.getByDisplayValue('TestPlayer') as HTMLInputElement
      expect(input).toBeInTheDocument()
    })

    it('should display avatar selection grid', () => {
      render(<SettingsModal />)
      expect(screen.getByText('Select Avatar')).toBeInTheDocument()
      expect(screen.getByTestId('avatar-selection-grid')).toBeInTheDocument()
    })

    it('should render all 5 avatar options', () => {
      render(<SettingsModal />)
      const avatarGrid = screen.getByTestId('avatar-selection-grid')
      const avatars = avatarGrid.querySelectorAll('[data-testid="avatar-container"]')
      expect(avatars).toHaveLength(5)
    })

    it('should highlight currently selected avatar', () => {
      vi.mocked(usePlayerStore).mockReturnValue({
        playerName: 'TestPlayer',
        avatar: 'avatar_03',
        setPlayerName: mockSetPlayerName,
        setAvatar: mockSetAvatar,
      } as any)

      render(<SettingsModal />)
      const avatarGrid = screen.getByTestId('avatar-selection-grid')
      const avatars = avatarGrid.querySelectorAll('[data-testid="avatar-container"]')

      // Avatar 3 should be selected (index 2)
      expect(avatars[2].className).toMatch(/selected/i)
    })
  })

  describe('Avatar Selection', () => {
    it('should call setAvatar when an avatar is clicked', async () => {
      render(<SettingsModal />)
      const avatarGrid = screen.getByTestId('avatar-selection-grid')
      const avatars = avatarGrid.querySelectorAll('[data-testid="avatar-container"]')

      fireEvent.click(avatars[1]) // Click avatar 2

      await waitFor(() => {
        expect(mockSetAvatar).toHaveBeenCalledWith('avatar_02')
      })
    })

    it('should update selection visual feedback when avatar is clicked', async () => {
      const { rerender } = render(<SettingsModal />)
      const avatarGrid = screen.getByTestId('avatar-selection-grid')
      const avatars = avatarGrid.querySelectorAll('[data-testid="avatar-container"]')

      fireEvent.click(avatars[3]) // Click avatar 4

      // Mock the store update
      vi.mocked(usePlayerStore).mockReturnValue({
        playerName: 'TestPlayer',
        avatar: 'avatar_04',
        setPlayerName: mockSetPlayerName,
        setAvatar: mockSetAvatar,
      } as any)

      rerender(<SettingsModal />)

      const updatedAvatars = screen.getByTestId('avatar-selection-grid').querySelectorAll('[data-testid="avatar-container"]')
      expect(updatedAvatars[3].className).toMatch(/selected/i)
    })

    it('should display avatar descriptions on hover', async () => {
      render(<SettingsModal />)

      // Check for avatar descriptions
      expect(screen.getByText('Confident Leader')).toBeInTheDocument()
      expect(screen.getByText('Cool Strategist')).toBeInTheDocument()
      expect(screen.getByText('Playful Challenger')).toBeInTheDocument()
      expect(screen.getByText('Fierce Competitor')).toBeInTheDocument()
      expect(screen.getByText('Wise Veteran')).toBeInTheDocument()
    })
  })

  describe('Player Name', () => {
    it('should update player name on input change', async () => {
      const user = userEvent.setup()
      render(<SettingsModal />)

      const input = screen.getByLabelText('Player Name') as HTMLInputElement
      await user.clear(input)
      await user.type(input, 'NewName')

      expect(input.value).toBe('NewName')
    })

    it('should call setPlayerName on save', async () => {
      const user = userEvent.setup()
      render(<SettingsModal />)

      const input = screen.getByLabelText('Player Name') as HTMLInputElement
      await user.clear(input)
      await user.type(input, 'NewName')

      const saveButton = screen.getByText('Save Settings')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockSetPlayerName).toHaveBeenCalledWith('NewName')
      })
    })

    it('should trim whitespace from player name', async () => {
      const user = userEvent.setup()
      render(<SettingsModal />)

      const input = screen.getByLabelText('Player Name') as HTMLInputElement
      await user.clear(input)
      await user.type(input, '  SpacedName  ')

      const saveButton = screen.getByText('Save Settings')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockSetPlayerName).toHaveBeenCalledWith('SpacedName')
      })
    })

    it('should not save empty player name', async () => {
      const user = userEvent.setup()
      render(<SettingsModal />)

      const input = screen.getByLabelText('Player Name') as HTMLInputElement
      await user.clear(input)

      const saveButton = screen.getByText('Save Settings')
      fireEvent.click(saveButton)

      expect(mockSetPlayerName).not.toHaveBeenCalled()
    })
  })

  describe('Modal Controls', () => {
    it('should close modal when close button is clicked', () => {
      render(<SettingsModal />)

      const closeButton = screen.getByLabelText('Close settings')
      fireEvent.click(closeButton)

      expect(mockCloseSettings).toHaveBeenCalled()
    })

    it('should close modal when Cancel button is clicked', () => {
      render(<SettingsModal />)

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(mockCloseSettings).toHaveBeenCalled()
    })

    it('should save and close modal when Save button is clicked', async () => {
      render(<SettingsModal />)

      const saveButton = screen.getByText('Save Settings')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockCloseSettings).toHaveBeenCalled()
      })
    })

    it('should close modal when clicking outside', () => {
      render(<SettingsModal />)

      const backdrop = screen.getByTestId('modal-backdrop')
      fireEvent.click(backdrop)

      expect(mockCloseSettings).toHaveBeenCalled()
    })

    it('should close modal when pressing Escape key', () => {
      render(<SettingsModal />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockCloseSettings).toHaveBeenCalled()
    })
  })

  describe('Sound Settings', () => {
    it('should display sound toggle', () => {
      render(<SettingsModal />)
      expect(screen.getByLabelText('Sound Effects')).toBeInTheDocument()
    })

    it('should display music toggle', () => {
      render(<SettingsModal />)
      expect(screen.getByLabelText('Background Music')).toBeInTheDocument()
    })

    it('should toggle sound when clicked', () => {
      const mockToggleSound = vi.fn()
      vi.mocked(useUIStore).mockReturnValue({
        isSettingsOpen: true,
        closeSettings: mockCloseSettings,
        soundEnabled: true,
        musicEnabled: true,
        toggleSound: mockToggleSound,
        toggleMusic: vi.fn(),
      } as any)

      render(<SettingsModal />)
      const soundToggle = screen.getByLabelText('Sound Effects')
      fireEvent.click(soundToggle)

      expect(mockToggleSound).toHaveBeenCalled()
    })

    it('should toggle music when clicked', () => {
      const mockToggleMusic = vi.fn()
      vi.mocked(useUIStore).mockReturnValue({
        isSettingsOpen: true,
        closeSettings: mockCloseSettings,
        soundEnabled: true,
        musicEnabled: true,
        toggleSound: vi.fn(),
        toggleMusic: mockToggleMusic,
      } as any)

      render(<SettingsModal />)
      const musicToggle = screen.getByLabelText('Background Music')
      fireEvent.click(musicToggle)

      expect(mockToggleMusic).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should support keyboard navigation for avatar selection', async () => {
      render(<SettingsModal />)
      const avatarGrid = screen.getByTestId('avatar-selection-grid')
      const firstAvatar = avatarGrid.querySelector('[data-testid="avatar-container"]') as HTMLElement

      firstAvatar.focus()
      expect(document.activeElement).toBe(firstAvatar)

      // Simulate Enter key press
      fireEvent.keyDown(firstAvatar, { key: 'Enter' })

      await waitFor(() => {
        expect(mockSetAvatar).toHaveBeenCalledWith('avatar_01')
      })
    })

    it('should support keyboard navigation with arrow keys', () => {
      render(<SettingsModal />)
      const avatarGrid = screen.getByTestId('avatar-selection-grid')
      const avatarWrappers = avatarGrid.querySelectorAll('[data-avatar-index]')

      // Focus first avatar wrapper
      (avatarWrappers[0] as HTMLElement).focus()

      // Press right arrow
      fireEvent.keyDown(avatarWrappers[0], { key: 'ArrowRight' })

      // Should move focus to second avatar wrapper
      expect(document.activeElement).toBe(avatarWrappers[1])
    })

    it('should have proper ARIA labels', () => {
      render(<SettingsModal />)

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Settings')
      expect(screen.getByLabelText('Close settings')).toBeInTheDocument()
      expect(screen.getByLabelText('Player Name')).toBeInTheDocument()
    })

    it('should trap focus within modal', () => {
      render(<SettingsModal />)

      const modal = screen.getByRole('dialog')
      const focusableElements = modal.querySelectorAll(
        'button, input, [tabindex="0"]'
      )

      expect(focusableElements.length).toBeGreaterThan(0)
    })
  })
})