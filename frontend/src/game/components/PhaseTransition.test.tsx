import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PhaseTransition } from './PhaseTransition'

describe('PhaseTransition', () => {
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    mockOnComplete.mockClear()
  })

  describe('Visibility', () => {
    it('should render when visible prop is true', () => {
      render(
        <PhaseTransition
          visible={true}
          phase="waiting"
          message="Test"
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should not render when visible prop is false', () => {
      render(
        <PhaseTransition
          visible={false}
          phase="waiting"
          message="Test"
          onComplete={mockOnComplete}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Waiting → Playing Transition', () => {
    it('should display "Game Starting" message', () => {
      render(
        <PhaseTransition
          visible={true}
          phase="playing"
          fromPhase="waiting"
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(/game starting/i)).toBeInTheDocument()
    })

    it('should display countdown (3, 2, 1)', async () => {
      render(
        <PhaseTransition
          visible={true}
          phase="playing"
          fromPhase="waiting"
          onComplete={mockOnComplete}
        />
      )

      // Should show 3 initially
      expect(screen.getByText('3')).toBeInTheDocument()

      // Wait for countdown
      await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument(), { timeout: 1000 })
      await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument(), { timeout: 1000 })
    })

    it('should complete after 2 seconds', async () => {
      render(
        <PhaseTransition
          visible={true}
          phase="playing"
          fromPhase="waiting"
          onComplete={mockOnComplete}
        />
      )

      await waitFor(() => expect(mockOnComplete).toHaveBeenCalled(), { timeout: 2500 })
    })
  })

  describe('Playing → Round End Transition', () => {
    it('should display winner announcement', () => {
      render(
        <PhaseTransition
          visible={true}
          phase="round_end"
          fromPhase="playing"
          winnerName="Player 1"
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(/player 1 wins the round/i)).toBeInTheDocument()
    })

    it('should display default winner name if not provided', () => {
      render(
        <PhaseTransition
          visible={true}
          phase="round_end"
          fromPhase="playing"
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(/round complete/i)).toBeInTheDocument()
    })

    it('should display winning card if provided', () => {
      render(
        <PhaseTransition
          visible={true}
          phase="round_end"
          fromPhase="playing"
          winnerName="Player 1"
          winningCard="Ace of Hearts"
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(/ace of hearts/i)).toBeInTheDocument()
    })

    it('should complete after 2 seconds', async () => {
      render(
        <PhaseTransition
          visible={true}
          phase="round_end"
          fromPhase="playing"
          winnerName="Player 1"
          onComplete={mockOnComplete}
        />
      )

      await waitFor(() => expect(mockOnComplete).toHaveBeenCalled(), { timeout: 2500 })
    })
  })

  describe('Round End → Playing Transition', () => {
    it('should display "Next Round" message', () => {
      render(
        <PhaseTransition
          visible={true}
          phase="playing"
          fromPhase="round_end"
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(/next round/i)).toBeInTheDocument()
    })

    it('should display round number if provided', () => {
      render(
        <PhaseTransition
          visible={true}
          phase="playing"
          fromPhase="round_end"
          roundNumber={3}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(/round 3/i)).toBeInTheDocument()
    })

    it('should display "Clearing table..." message', () => {
      render(
        <PhaseTransition
          visible={true}
          phase="playing"
          fromPhase="round_end"
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(/clearing table/i)).toBeInTheDocument()
    })

    it('should complete after 2 seconds', async () => {
      render(
        <PhaseTransition
          visible={true}
          phase="playing"
          fromPhase="round_end"
          onComplete={mockOnComplete}
        />
      )

      await waitFor(() => expect(mockOnComplete).toHaveBeenCalled(), { timeout: 2500 })
    })
  })

  describe('Playing → Game Over Transition', () => {
    it('should display "Game Over" message', () => {
      render(
        <PhaseTransition
          visible={true}
          phase="game_over"
          fromPhase="playing"
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(/game over/i)).toBeInTheDocument()
    })

    it('should display winner name', () => {
      render(
        <PhaseTransition
          visible={true}
          phase="game_over"
          fromPhase="playing"
          winnerName="Player 2"
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(/player 2 wins!/i)).toBeInTheDocument()
    })

    it('should display victory celebration icon', () => {
      const { container } = render(
        <PhaseTransition
          visible={true}
          phase="game_over"
          fromPhase="playing"
          winnerName="Player 2"
          onComplete={mockOnComplete}
        />
      )

      // Check for trophy/celebration icon
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should display final score if provided', () => {
      render(
        <PhaseTransition
          visible={true}
          phase="game_over"
          fromPhase="playing"
          winnerName="Player 2"
          finalScore={21}
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(/21 points/i)).toBeInTheDocument()
    })

    it('should complete after 2 seconds', async () => {
      render(
        <PhaseTransition
          visible={true}
          phase="game_over"
          fromPhase="playing"
          winnerName="Player 2"
          onComplete={mockOnComplete}
        />
      )

      await waitFor(() => expect(mockOnComplete).toHaveBeenCalled(), { timeout: 2500 })
    })
  })

  describe('Animation Duration', () => {
    it('should have 2-second duration for all transitions', async () => {
      const startTime = Date.now()

      render(
        <PhaseTransition
          visible={true}
          phase="playing"
          fromPhase="waiting"
          onComplete={mockOnComplete}
        />
      )

      await waitFor(() => expect(mockOnComplete).toHaveBeenCalled(), { timeout: 2500 })

      const duration = Date.now() - startTime
      // Allow 100ms tolerance for test execution
      expect(duration).toBeGreaterThanOrEqual(1900)
      expect(duration).toBeLessThanOrEqual(2200)
    })
  })

  describe('Styling', () => {
    it('should have full-screen overlay', () => {
      const { container } = render(
        <PhaseTransition
          visible={true}
          phase="playing"
          fromPhase="waiting"
          onComplete={mockOnComplete}
        />
      )

      const overlay = container.firstChild as HTMLElement
      expect(overlay).toHaveClass('fixed')
      expect(overlay).toHaveClass('inset-0')
    })

    it('should have semi-transparent backdrop', () => {
      const { container } = render(
        <PhaseTransition
          visible={true}
          phase="playing"
          fromPhase="waiting"
          onComplete={mockOnComplete}
        />
      )

      const overlay = container.firstChild as HTMLElement
      expect(overlay).toHaveClass('bg-black/50')
    })

    it('should have high z-index (above game)', () => {
      const { container } = render(
        <PhaseTransition
          visible={true}
          phase="playing"
          fromPhase="waiting"
          onComplete={mockOnComplete}
        />
      )

      const overlay = container.firstChild as HTMLElement
      expect(overlay).toHaveClass('z-40')
    })
  })

  describe('Accessibility', () => {
    it('should have dialog role', () => {
      render(
        <PhaseTransition
          visible={true}
          phase="playing"
          fromPhase="waiting"
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should have aria-labelledby', () => {
      render(
        <PhaseTransition
          visible={true}
          phase="playing"
          fromPhase="waiting"
          onComplete={mockOnComplete}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby')
    })

    it('should announce status changes for screen readers', () => {
      render(
        <PhaseTransition
          visible={true}
          phase="playing"
          fromPhase="waiting"
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing winnerName gracefully', () => {
      render(
        <PhaseTransition
          visible={true}
          phase="round_end"
          fromPhase="playing"
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText(/round complete/i)).toBeInTheDocument()
    })

    it('should handle missing onComplete callback', () => {
      render(
        <PhaseTransition
          visible={true}
          phase="playing"
          fromPhase="waiting"
          onComplete={undefined as any}
        />
      )

      // Should render without crashing
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should handle null phase gracefully', () => {
      render(<PhaseTransition visible={true} phase={null as any} onComplete={mockOnComplete} />)

      // Should not crash
      expect(screen.queryByRole('dialog')).toBeInTheDocument()
    })
  })
})
