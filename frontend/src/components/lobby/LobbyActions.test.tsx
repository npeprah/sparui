import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LobbyActions } from './LobbyActions'

describe('LobbyActions', () => {
  const mockOnReady = vi.fn()
  const mockOnStartGame = vi.fn()
  const mockOnLeave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Host behavior', () => {
    it('should show Ready button when host is not ready', () => {
      render(
        <LobbyActions
          isHost={true}
          isReady={false}
          canStartGame={false}
          onReady={mockOnReady}
          onStartGame={mockOnStartGame}
          onLeave={mockOnLeave}
        />
      )

      const readyButton = screen.getByRole('button', { name: /ready up/i })
      expect(readyButton).toBeInTheDocument()
      expect(readyButton).not.toBeDisabled()
    })

    it('should show "✓ Ready" button when host is ready but game cannot start', () => {
      render(
        <LobbyActions
          isHost={true}
          isReady={true}
          canStartGame={false}
          onReady={mockOnReady}
          onStartGame={mockOnStartGame}
          onLeave={mockOnLeave}
        />
      )

      const readyButton = screen.getByRole('button', { name: /✓ ready/i })
      expect(readyButton).toBeInTheDocument()
      expect(readyButton).not.toBeDisabled()
    })

    it('should allow host to toggle ready status', async () => {
      const user = userEvent.setup()
      render(
        <LobbyActions
          isHost={true}
          isReady={false}
          canStartGame={false}
          onReady={mockOnReady}
          onStartGame={mockOnStartGame}
          onLeave={mockOnLeave}
        />
      )

      const readyButton = screen.getByRole('button', { name: /ready up/i })
      await user.click(readyButton)

      expect(mockOnReady).toHaveBeenCalledTimes(1)
    })

    it('should show Start Game button only when all players are ready', () => {
      render(
        <LobbyActions
          isHost={true}
          isReady={true}
          canStartGame={true}
          onReady={mockOnReady}
          onStartGame={mockOnStartGame}
          onLeave={mockOnLeave}
        />
      )

      const startButton = screen.getByRole('button', { name: /start game/i })
      expect(startButton).toBeInTheDocument()
      expect(startButton).not.toBeDisabled()
    })

    it('should call onStartGame when Start Game is clicked', async () => {
      const user = userEvent.setup()
      render(
        <LobbyActions
          isHost={true}
          isReady={true}
          canStartGame={true}
          onReady={mockOnReady}
          onStartGame={mockOnStartGame}
          onLeave={mockOnLeave}
        />
      )

      const startButton = screen.getByRole('button', { name: /start game/i })
      await user.click(startButton)

      expect(mockOnStartGame).toHaveBeenCalledTimes(1)
    })

    it('should disable Start Game button when loading', () => {
      render(
        <LobbyActions
          isHost={true}
          isReady={true}
          canStartGame={true}
          isLoading={true}
          onReady={mockOnReady}
          onStartGame={mockOnStartGame}
          onLeave={mockOnLeave}
        />
      )

      const startButton = screen.getByRole('button', { name: /starting/i })
      expect(startButton).toBeDisabled()
    })

    it('should show correct helper text when host is not ready', () => {
      render(
        <LobbyActions
          isHost={true}
          isReady={false}
          canStartGame={false}
          onReady={mockOnReady}
          onStartGame={mockOnStartGame}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByText(/click ready when all players are in the lobby/i)).toBeInTheDocument()
    })

    it('should show correct helper text when host is ready but waiting for others', () => {
      render(
        <LobbyActions
          isHost={true}
          isReady={true}
          canStartGame={false}
          onReady={mockOnReady}
          onStartGame={mockOnStartGame}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByText(/waiting for all players to be ready/i)).toBeInTheDocument()
    })

    it('should show correct helper text when all players are ready', () => {
      render(
        <LobbyActions
          isHost={true}
          isReady={true}
          canStartGame={true}
          onReady={mockOnReady}
          onStartGame={mockOnStartGame}
          onLeave={mockOnLeave}
        />
      )

      expect(
        screen.getByText(/all players are ready! click to start the game/i)
      ).toBeInTheDocument()
    })
  })

  describe('Non-host player behavior', () => {
    it('should show Ready button when player is not ready', () => {
      render(
        <LobbyActions
          isHost={false}
          isReady={false}
          canStartGame={false}
          onReady={mockOnReady}
          onStartGame={mockOnStartGame}
          onLeave={mockOnLeave}
        />
      )

      const readyButton = screen.getByRole('button', { name: /ready up/i })
      expect(readyButton).toBeInTheDocument()
      expect(readyButton).not.toBeDisabled()
    })

    it('should show "✓ Ready" button when player is ready', () => {
      render(
        <LobbyActions
          isHost={false}
          isReady={true}
          canStartGame={false}
          onReady={mockOnReady}
          onStartGame={mockOnStartGame}
          onLeave={mockOnLeave}
        />
      )

      const readyButton = screen.getByRole('button', { name: /✓ ready/i })
      expect(readyButton).toBeInTheDocument()
      expect(readyButton).not.toBeDisabled()
    })

    it('should never show Start Game button to non-host', () => {
      render(
        <LobbyActions
          isHost={false}
          isReady={true}
          canStartGame={true}
          onReady={mockOnReady}
          onStartGame={mockOnStartGame}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.queryByRole('button', { name: /start game/i })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /✓ ready/i })).toBeInTheDocument()
    })
  })

  describe('Leave button', () => {
    it('should always show Leave Lobby button', () => {
      render(
        <LobbyActions
          isHost={true}
          isReady={false}
          canStartGame={false}
          onReady={mockOnReady}
          onStartGame={mockOnStartGame}
          onLeave={mockOnLeave}
        />
      )

      expect(screen.getByRole('button', { name: /leave lobby/i })).toBeInTheDocument()
    })

    it('should call onLeave when Leave Lobby is clicked', async () => {
      const user = userEvent.setup()
      render(
        <LobbyActions
          isHost={false}
          isReady={false}
          canStartGame={false}
          onReady={mockOnReady}
          onStartGame={mockOnStartGame}
          onLeave={mockOnLeave}
        />
      )

      const leaveButton = screen.getByRole('button', { name: /leave lobby/i })
      await user.click(leaveButton)

      expect(mockOnLeave).toHaveBeenCalledTimes(1)
    })
  })
})
