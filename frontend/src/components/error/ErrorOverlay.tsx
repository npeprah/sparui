import { ConnectionState } from '../../services/connectionManager'

export interface ErrorOverlayProps {
  /** Current connection state */
  state: ConnectionState
  /** Current reconnection attempt number */
  attemptCount: number
  /** Maximum number of attempts (default: 5) */
  maxAttempts?: number
  /** Error message to display */
  errorMessage?: string | null
  /** Callback when user clicks retry */
  onRetry?: () => void
}

/**
 * Full-screen overlay displayed when connection is lost
 *
 * Features:
 * - Displays reconnection progress during automatic retries
 * - Shows error message after max attempts
 * - Provides manual retry button
 * - User-friendly messaging
 * - Accessible with ARIA attributes
 */
export function ErrorOverlay({
  state,
  attemptCount,
  maxAttempts = 5,
  errorMessage,
  onRetry,
}: ErrorOverlayProps) {
  // Only show overlay when reconnecting or in error state
  if (state !== ConnectionState.RECONNECTING && state !== ConnectionState.ERROR) {
    return null
  }

  const isReconnecting = state === ConnectionState.RECONNECTING
  const isError = state === ConnectionState.ERROR

  // Default messages
  const defaultTitle = isReconnecting ? 'Connection Interrupted' : 'Unable to Connect'
  const defaultMessage = isReconnecting
    ? 'Attempting to reconnect...'
    : 'Connection lost. Please check your internet connection and try again.'

  const displayMessage = errorMessage?.trim() || defaultMessage

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-labelledby="error-overlay-title"
      aria-describedby="error-overlay-description"
    >
      <div className="max-w-md rounded-lg bg-deepPurple p-8 text-center shadow-2xl">
        {/* Title */}
        <h2 id="error-overlay-title" className="mb-4 text-2xl font-bold text-white">
          {defaultTitle}
        </h2>

        {/* Icon/Spinner */}
        <div className="mb-6 flex justify-center">
          {isReconnecting ? (
            // Loading spinner
            <div role="status" aria-label="Reconnecting">
              <svg
                className="h-12 w-12 animate-spin text-gold"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : (
            // Error icon
            <svg
              className="h-12 w-12 text-fireRed"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
        </div>

        {/* Description */}
        <p id="error-overlay-description" className="mb-4 text-lg text-gray-200">
          {displayMessage}
        </p>

        {/* Attempt counter (only during reconnection) */}
        {isReconnecting && (
          <p className="mb-6 text-sm text-gray-400">
            Attempt {attemptCount} of {maxAttempts}
          </p>
        )}

        {/* Error state: Retry button and instructions */}
        {isError && (
          <>
            <button
              onClick={handleRetry}
              className="mb-4 w-full rounded-lg bg-fireRed px-6 py-3 font-bold text-white transition-all duration-200 hover:bg-fireRed/90 hover:scale-105"
              type="button"
            >
              Retry Connection
            </button>

            {attemptCount >= maxAttempts && (
              <p className="text-sm text-gray-400">
                If the problem persists, please refresh the page or check your internet connection.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
