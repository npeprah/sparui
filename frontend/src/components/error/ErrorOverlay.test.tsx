import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorOverlay } from './ErrorOverlay'
import { ConnectionState } from '../../services/connectionManager'

describe('ErrorOverlay', () => {
  const mockOnRetry = vi.fn()

  beforeEach(() => {
    mockOnRetry.mockClear()
  })

  describe('Visibility', () => {
    it('should not render when state is CONNECTED', () => {
      render(
        <ErrorOverlay state={ConnectionState.CONNECTED} attemptCount={0} onRetry={mockOnRetry} />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should not render when state is DISCONNECTED', () => {
      render(
        <ErrorOverlay state={ConnectionState.DISCONNECTED} attemptCount={0} onRetry={mockOnRetry} />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render when state is RECONNECTING', () => {
      render(
        <ErrorOverlay state={ConnectionState.RECONNECTING} attemptCount={1} onRetry={mockOnRetry} />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should render when state is ERROR', () => {
      render(
        <ErrorOverlay
          state={ConnectionState.ERROR}
          attemptCount={5}
          errorMessage="Connection failed"
          onRetry={mockOnRetry}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('Reconnecting State', () => {
    it('should display reconnection message', () => {
      render(
        <ErrorOverlay state={ConnectionState.RECONNECTING} attemptCount={1} onRetry={mockOnRetry} />
      )

      expect(screen.getByText(/attempting to reconnect/i)).toBeInTheDocument()
    })

    it('should display attempt count', () => {
      render(
        <ErrorOverlay
          state={ConnectionState.RECONNECTING}
          attemptCount={3}
          maxAttempts={5}
          onRetry={mockOnRetry}
        />
      )

      expect(screen.getByText(/attempt 3 of 5/i)).toBeInTheDocument()
    })

    it('should display default max attempts (5)', () => {
      render(
        <ErrorOverlay state={ConnectionState.RECONNECTING} attemptCount={2} onRetry={mockOnRetry} />
      )

      expect(screen.getByText(/attempt 2 of 5/i)).toBeInTheDocument()
    })

    it('should display loading spinner', () => {
      render(
        <ErrorOverlay state={ConnectionState.RECONNECTING} attemptCount={1} onRetry={mockOnRetry} />
      )

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should not display retry button during reconnection', () => {
      render(
        <ErrorOverlay state={ConnectionState.RECONNECTING} attemptCount={1} onRetry={mockOnRetry} />
      )

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should display error message', () => {
      render(
        <ErrorOverlay
          state={ConnectionState.ERROR}
          attemptCount={5}
          errorMessage="Unable to connect to server"
          onRetry={mockOnRetry}
        />
      )

      expect(screen.getByText(/unable to connect to server/i)).toBeInTheDocument()
    })

    it('should display default error message when none provided', () => {
      render(<ErrorOverlay state={ConnectionState.ERROR} attemptCount={5} onRetry={mockOnRetry} />)

      expect(screen.getByText(/connection lost/i)).toBeInTheDocument()
    })

    it('should display retry button', () => {
      render(<ErrorOverlay state={ConnectionState.ERROR} attemptCount={5} onRetry={mockOnRetry} />)

      const retryButton = screen.getByRole('button', { name: /retry connection/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('should call onRetry when retry button clicked', () => {
      render(<ErrorOverlay state={ConnectionState.ERROR} attemptCount={5} onRetry={mockOnRetry} />)

      const retryButton = screen.getByRole('button', { name: /retry connection/i })
      retryButton.click()

      expect(mockOnRetry).toHaveBeenCalledTimes(1)
    })

    it('should display refresh page message after max attempts', () => {
      render(
        <ErrorOverlay
          state={ConnectionState.ERROR}
          attemptCount={5}
          maxAttempts={5}
          onRetry={mockOnRetry}
        />
      )

      expect(screen.getByText(/please refresh the page/i)).toBeInTheDocument()
    })

    it('should not display loading spinner in error state', () => {
      render(<ErrorOverlay state={ConnectionState.ERROR} attemptCount={5} onRetry={mockOnRetry} />)

      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have full-screen overlay backdrop', () => {
      const { container } = render(
        <ErrorOverlay state={ConnectionState.RECONNECTING} attemptCount={1} onRetry={mockOnRetry} />
      )

      const overlay = container.firstChild as HTMLElement
      expect(overlay).toHaveClass('fixed')
      expect(overlay).toHaveClass('inset-0')
    })

    it('should have dark backdrop', () => {
      const { container } = render(
        <ErrorOverlay state={ConnectionState.RECONNECTING} attemptCount={1} onRetry={mockOnRetry} />
      )

      const overlay = container.firstChild as HTMLElement
      expect(overlay).toHaveClass('bg-black/80')
    })

    it('should center content', () => {
      const { container } = render(
        <ErrorOverlay state={ConnectionState.RECONNECTING} attemptCount={1} onRetry={mockOnRetry} />
      )

      const overlay = container.firstChild as HTMLElement
      expect(overlay).toHaveClass('flex')
      expect(overlay).toHaveClass('items-center')
      expect(overlay).toHaveClass('justify-center')
    })

    it('should have high z-index', () => {
      const { container } = render(
        <ErrorOverlay state={ConnectionState.RECONNECTING} attemptCount={1} onRetry={mockOnRetry} />
      )

      const overlay = container.firstChild as HTMLElement
      expect(overlay).toHaveClass('z-50')
    })
  })

  describe('Accessibility', () => {
    it('should have dialog role', () => {
      render(
        <ErrorOverlay state={ConnectionState.RECONNECTING} attemptCount={1} onRetry={mockOnRetry} />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should have aria-labelledby', () => {
      render(
        <ErrorOverlay state={ConnectionState.RECONNECTING} attemptCount={1} onRetry={mockOnRetry} />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby')
    })

    it('should have aria-describedby', () => {
      render(
        <ErrorOverlay state={ConnectionState.RECONNECTING} attemptCount={1} onRetry={mockOnRetry} />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-describedby')
    })

    it('should have loading status role during reconnection', () => {
      render(
        <ErrorOverlay state={ConnectionState.RECONNECTING} attemptCount={1} onRetry={mockOnRetry} />
      )

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should have accessible retry button', () => {
      render(<ErrorOverlay state={ConnectionState.ERROR} attemptCount={5} onRetry={mockOnRetry} />)

      const retryButton = screen.getByRole('button', { name: /retry connection/i })
      expect(retryButton).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle null error message', () => {
      render(
        <ErrorOverlay
          state={ConnectionState.ERROR}
          attemptCount={5}
          errorMessage={null as any}
          onRetry={mockOnRetry}
        />
      )

      expect(screen.getByText(/connection lost/i)).toBeInTheDocument()
    })

    it('should handle undefined error message', () => {
      render(
        <ErrorOverlay
          state={ConnectionState.ERROR}
          attemptCount={5}
          errorMessage={undefined}
          onRetry={mockOnRetry}
        />
      )

      expect(screen.getByText(/connection lost/i)).toBeInTheDocument()
    })

    it('should handle empty error message', () => {
      render(
        <ErrorOverlay
          state={ConnectionState.ERROR}
          attemptCount={5}
          errorMessage=""
          onRetry={mockOnRetry}
        />
      )

      expect(screen.getByText(/connection lost/i)).toBeInTheDocument()
    })

    it('should handle attempt count of 0', () => {
      render(
        <ErrorOverlay state={ConnectionState.RECONNECTING} attemptCount={0} onRetry={mockOnRetry} />
      )

      // Should still render but show attempt 0
      expect(screen.getByText(/attempt 0 of 5/i)).toBeInTheDocument()
    })

    it('should handle missing onRetry callback', () => {
      render(
        <ErrorOverlay state={ConnectionState.ERROR} attemptCount={5} onRetry={undefined as any} />
      )

      const retryButton = screen.queryByRole('button', { name: /retry connection/i })
      // Should still render button but not crash on click
      expect(retryButton).toBeInTheDocument()
    })
  })

  describe('User-Friendly Messages', () => {
    it('should display user-friendly title for reconnection', () => {
      render(
        <ErrorOverlay state={ConnectionState.RECONNECTING} attemptCount={1} onRetry={mockOnRetry} />
      )

      expect(screen.getByText(/connection interrupted/i)).toBeInTheDocument()
    })

    it('should display user-friendly title for error', () => {
      render(<ErrorOverlay state={ConnectionState.ERROR} attemptCount={5} onRetry={mockOnRetry} />)

      expect(screen.getByText(/unable to connect/i)).toBeInTheDocument()
    })

    it('should display helpful instructions in error state', () => {
      render(<ErrorOverlay state={ConnectionState.ERROR} attemptCount={5} onRetry={mockOnRetry} />)

      expect(screen.getByText(/please check your internet connection/i)).toBeInTheDocument()
    })
  })
})
