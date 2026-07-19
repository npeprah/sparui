import { describe, it, expect } from 'vitest'
import { mapPlayersToPositions, getPlayerPosition } from './playerPositions'
import type { Player } from '../../store/types'

describe('playerPositions', () => {
  describe('mapPlayersToPositions', () => {
    it('should map current player to bottom position', () => {
      const players: Player[] = [
        { id: 'player-1', name: 'Alice', score: 0, isReady: true, isConnected: true, winStreak: 0 },
      ]
      const currentPlayerId = 'player-1'

      const result = mapPlayersToPositions(players, currentPlayerId)

      expect(result.get('bottom')).toBe('player-1')
    })

    it('should map 2 players: current to bottom, opponent to top', () => {
      const players: Player[] = [
        { id: 'player-1', name: 'Alice', score: 0, isReady: true, isConnected: true, winStreak: 0 },
        { id: 'player-2', name: 'Bob', score: 0, isReady: true, isConnected: true, winStreak: 0 },
      ]
      const currentPlayerId = 'player-1'

      const result = mapPlayersToPositions(players, currentPlayerId)

      expect(result.get('bottom')).toBe('player-1')
      expect(result.get('top')).toBe('player-2')
      expect(result.get('left')).toBeUndefined()
      expect(result.get('right')).toBeUndefined()
    })

    it('should map 3 players: current to bottom, others to left and top', () => {
      const players: Player[] = [
        { id: 'player-1', name: 'Alice', score: 0, isReady: true, isConnected: true, winStreak: 0 },
        { id: 'player-2', name: 'Bob', score: 0, isReady: true, isConnected: true, winStreak: 0 },
        {
          id: 'player-3',
          name: 'Charlie',
          score: 0,
          isReady: true,
          isConnected: true,
          winStreak: 0,
        },
      ]
      const currentPlayerId = 'player-1'

      const result = mapPlayersToPositions(players, currentPlayerId)

      expect(result.get('bottom')).toBe('player-1')
      expect(result.get('left')).toBe('player-2')
      expect(result.get('top')).toBe('player-3')
      expect(result.get('right')).toBeUndefined()
    })

    it('should map 4 players: current to bottom, others clockwise', () => {
      const players: Player[] = [
        { id: 'player-1', name: 'Alice', score: 0, isReady: true, isConnected: true, winStreak: 0 },
        { id: 'player-2', name: 'Bob', score: 0, isReady: true, isConnected: true, winStreak: 0 },
        {
          id: 'player-3',
          name: 'Charlie',
          score: 0,
          isReady: true,
          isConnected: true,
          winStreak: 0,
        },
        { id: 'player-4', name: 'David', score: 0, isReady: true, isConnected: true, winStreak: 0 },
      ]
      const currentPlayerId = 'player-1'

      const result = mapPlayersToPositions(players, currentPlayerId)

      expect(result.get('bottom')).toBe('player-1')
      expect(result.get('left')).toBe('player-2')
      expect(result.get('top')).toBe('player-3')
      expect(result.get('right')).toBe('player-4')
    })

    it('should handle current player not at start of array', () => {
      const players: Player[] = [
        { id: 'player-1', name: 'Alice', score: 0, isReady: true, isConnected: true, winStreak: 0 },
        { id: 'player-2', name: 'Bob', score: 0, isReady: true, isConnected: true, winStreak: 0 },
        {
          id: 'player-3',
          name: 'Charlie',
          score: 0,
          isReady: true,
          isConnected: true,
          winStreak: 0,
        },
        { id: 'player-4', name: 'David', score: 0, isReady: true, isConnected: true, winStreak: 0 },
      ]
      const currentPlayerId = 'player-3'

      const result = mapPlayersToPositions(players, currentPlayerId)

      // player-3 should be at bottom
      expect(result.get('bottom')).toBe('player-3')
      // Others should follow clockwise: player-4, player-1, player-2
      expect(result.get('left')).toBe('player-4')
      expect(result.get('top')).toBe('player-1')
      expect(result.get('right')).toBe('player-2')
    })

    it('should return empty map if current player not found', () => {
      const players: Player[] = [
        { id: 'player-1', name: 'Alice', score: 0, isReady: true, isConnected: true, winStreak: 0 },
      ]
      const currentPlayerId = 'player-99'

      const result = mapPlayersToPositions(players, currentPlayerId)

      expect(result.size).toBe(0)
    })
  })

  describe('getPlayerPosition', () => {
    it('should return position for a player ID', () => {
      const positionMap = new Map([
        ['bottom', 'player-1'],
        ['left', 'player-2'],
        ['top', 'player-3'],
        ['right', 'player-4'],
      ])

      expect(getPlayerPosition('player-1', positionMap)).toBe('bottom')
      expect(getPlayerPosition('player-2', positionMap)).toBe('left')
      expect(getPlayerPosition('player-3', positionMap)).toBe('top')
      expect(getPlayerPosition('player-4', positionMap)).toBe('right')
    })

    it('should return undefined for unknown player', () => {
      const positionMap = new Map([['bottom', 'player-1']])

      expect(getPlayerPosition('player-99', positionMap)).toBeUndefined()
    })
  })
})
