import { PlayerSlot } from './PlayerSlot'
import type { LobbyPlayer } from '../../store/types'

interface PlayerListProps {
  players: LobbyPlayer[]
  maxPlayers: number
  currentPlayerId: string
}

export function PlayerList({ players, maxPlayers, currentPlayerId }: PlayerListProps) {
  // Create array with player data and empty slots
  const slots = Array.from({ length: maxPlayers }, (_, index) => {
    return players[index] || null
  })

  return (
    <div className="bg-gray-800 rounded-lg p-4 md:p-6 mb-4 md:mb-6">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-bold text-white">
          Players ({players.length}/{maxPlayers})
        </h2>
        <div className="text-xs md:text-sm text-gray-400">
          {players.filter((p) => p.isReady).length} ready
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {slots.map((player, index) => (
          <PlayerSlot
            key={player?.id || `slot-${index}`}
            player={player}
            slotNumber={index + 1}
            isCurrentPlayer={player?.id === currentPlayerId}
          />
        ))}
      </div>
    </div>
  )
}
