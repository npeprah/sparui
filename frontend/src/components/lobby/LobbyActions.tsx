import { Button } from '../ui'

interface LobbyActionsProps {
  isHost: boolean
  isReady: boolean
  canStartGame: boolean
  isLoading?: boolean
  onReady: () => void
  onStartGame: () => void
  onLeave: () => void
}

export function LobbyActions({
  isHost,
  isReady,
  canStartGame,
  isLoading = false,
  onReady,
  onStartGame,
  onLeave,
}: LobbyActionsProps) {
  return (
    <div className="space-y-3 md:space-y-4">
      {/* Main Action Button */}
      <div className="flex gap-3 md:gap-4">
        {isHost && canStartGame ? (
          // Host sees Start Game button only when all players are ready
          <Button
            variant="primary"
            size="lg"
            onClick={onStartGame}
            disabled={isLoading}
            fullWidth
            className="bg-gold hover:bg-opacity-90 text-gray-900 font-bold uppercase tracking-wide"
          >
            {isLoading ? 'Starting...' : 'Start Game'}
          </Button>
        ) : (
          // Both host and non-host players see Ready button when game cannot start
          <Button
            variant={isReady ? 'success' : 'primary'}
            size="lg"
            onClick={onReady}
            disabled={isLoading}
            fullWidth
            className="font-bold uppercase tracking-wide"
          >
            {isReady ? '✓ Ready' : 'Ready Up'}
          </Button>
        )}
      </div>

      {/* Leave Button */}
      <Button
        variant="danger"
        size="md"
        onClick={onLeave}
        disabled={isLoading}
        fullWidth
        className="font-medium"
      >
        Leave Lobby
      </Button>

      {/* Helper Text */}
      <div className="text-center">
        {isHost ? (
          <p className="text-xs text-gray-400">
            {canStartGame
              ? 'All players are ready! Click to start the game.'
              : isReady
                ? 'Waiting for all players to be ready.'
                : 'Click Ready when all players are in the lobby.'}
          </p>
        ) : (
          <p className="text-xs text-gray-400">
            {isReady
              ? 'Waiting for host to start the game...'
              : "Click Ready when you're ready to play!"}
          </p>
        )}
      </div>
    </div>
  )
}
