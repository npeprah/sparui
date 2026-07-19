import type { Player } from '../../store/types'

/**
 * Player position around the table
 */
export type PlayerPosition = 'bottom' | 'left' | 'top' | 'right'

/**
 * Maps player IDs to screen positions around the table
 *
 * Bottom = Current player (you)
 * Left = Player to your left (clockwise)
 * Top = Player across from you
 * Right = Player to your right (clockwise)
 *
 * @param players - All players in the game
 * @param currentPlayerId - The current/local player's ID
 * @returns Map of position -> player ID
 */
export function mapPlayersToPositions(
  players: Player[],
  currentPlayerId: string
): Map<PlayerPosition, string> {
  const positionMap = new Map<PlayerPosition, string>()

  // Find current player index
  const currentIndex = players.findIndex(p => p.id === currentPlayerId)
  if (currentIndex === -1) {
    return positionMap // Return empty if current player not found
  }

  // Position mapping for different player counts
  // 2 players: bottom, top (across from each other)
  // 3 players: bottom, left, top
  // 4 players: bottom, left, top, right (full circle)
  const positionsByPlayerCount: Record<number, PlayerPosition[]> = {
    1: ['bottom'],
    2: ['bottom', 'top'],
    3: ['bottom', 'left', 'top'],
    4: ['bottom', 'left', 'top', 'right'],
  }

  const positions = positionsByPlayerCount[players.length] || ['bottom']

  // Map players starting from current player
  positions.forEach((position, offset) => {
    const playerIndex = (currentIndex + offset) % players.length
    const player = players[playerIndex]
    positionMap.set(position, player.id)
  })

  return positionMap
}

/**
 * Gets the screen position for a player ID
 *
 * @param playerId - Player ID to look up
 * @param positionMap - Map of position -> player ID
 * @returns The player's screen position or undefined if not found
 */
export function getPlayerPosition(
  playerId: string,
  positionMap: Map<PlayerPosition, string>
): PlayerPosition | undefined {
  for (const [position, id] of positionMap.entries()) {
    if (id === playerId) {
      return position
    }
  }
  return undefined
}
