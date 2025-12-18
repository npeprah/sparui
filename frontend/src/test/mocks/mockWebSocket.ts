import { vi } from 'vitest'
import type { Card, Player } from '../../store/types'

/**
 * Mock WebSocket Event Payloads
 */
export interface MockGameStartedPayload {
  leaderId: string
  players: Player[]
  roundNumber: number
}

export interface MockCardPlayedPayload {
  playerId: string
  card: Card
  currentSuit: string | null
}

export interface MockRoundWonPayload {
  winnerId: string
  winnerName: string
  winningCard: Card
  points: number
  isDry: boolean
  isShowDry: boolean
  newScores: Record<string, number>
}

export interface MockGameEndedPayload {
  winnerId: string
  winnerName: string
  finalScores: Record<string, number>
}

export interface MockTurnChangedPayload {
  currentPlayerId: string
  timeRemaining: number
}

export interface MockTimerUpdatePayload {
  timeRemaining: number
}

/**
 * Mock WebSocket Client for Testing
 *
 * Simulates Socket.io client behavior for integration tests.
 * Provides methods to trigger server events and verify client emissions.
 */
export class MockWebSocket {
  private listeners: Map<string, Set<Function>> = new Map()
  private emitted: Array<{ event: string; data: any }> = []
  public connected: boolean = false

  constructor() {
    // Auto-connect on creation
    this.connected = true
  }

  /**
   * Register event listener (simulates socket.on())
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  /**
   * Unregister event listener (simulates socket.off())
   */
  off(event: string, callback?: Function): void {
    if (!callback) {
      this.listeners.delete(event)
      return
    }

    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  /**
   * Emit event to server (simulates socket.emit())
   * Records emission for verification in tests
   */
  emit(event: string, data?: any): void {
    this.emitted.push({ event, data })
  }

  /**
   * Simulate receiving event from server
   * Triggers all registered listeners for the event
   */
  simulateServerEvent(event: string, data: any): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach((callback) => callback(data))
    }
  }

  /**
   * Connect socket (simulates socket.connect())
   */
  connect(): void {
    this.connected = true
    this.simulateServerEvent('connect', {})
  }

  /**
   * Disconnect socket (simulates socket.disconnect())
   */
  disconnect(): void {
    this.connected = false
    this.simulateServerEvent('disconnect', {})
  }

  /**
   * Clear all listeners
   */
  clearListeners(): void {
    this.listeners.clear()
  }

  /**
   * Get emitted events (for test verification)
   */
  getEmitted(): Array<{ event: string; data: any }> {
    return [...this.emitted]
  }

  /**
   * Clear emitted events history
   */
  clearEmitted(): void {
    this.emitted = []
  }

  /**
   * Check if specific event was emitted
   */
  wasEmitted(event: string): boolean {
    return this.emitted.some((e) => e.event === event)
  }

  /**
   * Get emitted data for specific event
   */
  getEmittedData(event: string): any[] {
    return this.emitted.filter((e) => e.event === event).map((e) => e.data)
  }
}

/**
 * Helper: Create mock player for testing
 */
export function createMockPlayer(
  id: string,
  name: string = `Player ${id}`,
  overrides?: Partial<Player>
): Player {
  return {
    id,
    name,
    score: 0,
    isReady: true,
    isConnected: true,
    winStreak: 0,
    ...overrides,
  }
}

/**
 * Helper: Create mock card for testing
 */
export function createMockCard(suit: Card['suit'], rank: Card['rank'], id?: string): Card {
  return {
    suit,
    rank,
    id: id || `${suit}-${rank}`,
  }
}

/**
 * Helper: Simulate full game start sequence
 */
export function simulateGameStart(
  socket: MockWebSocket,
  players: Player[],
  leaderId: string
): void {
  socket.simulateServerEvent('gameStarted', {
    leaderId,
    players,
    roundNumber: 1,
  } as MockGameStartedPayload)
}

/**
 * Helper: Simulate card play
 */
export function simulateCardPlay(
  socket: MockWebSocket,
  playerId: string,
  card: Card,
  currentSuit: string | null = null
): void {
  socket.simulateServerEvent('cardPlayed', {
    playerId,
    card,
    currentSuit: currentSuit || card.suit,
  } as MockCardPlayedPayload)
}

/**
 * Helper: Simulate round won
 */
export function simulateRoundWon(
  socket: MockWebSocket,
  winnerId: string,
  winnerName: string,
  winningCard: Card,
  points: number = 1,
  newScores: Record<string, number> = {}
): void {
  socket.simulateServerEvent('roundWon', {
    winnerId,
    winnerName,
    winningCard,
    points,
    isDry: false,
    isShowDry: false,
    newScores,
  } as MockRoundWonPayload)
}

/**
 * Helper: Simulate game ended
 */
export function simulateGameEnded(
  socket: MockWebSocket,
  winnerId: string,
  winnerName: string,
  finalScores: Record<string, number>
): void {
  socket.simulateServerEvent('gameEnded', {
    winnerId,
    winnerName,
    finalScores,
  } as MockGameEndedPayload)
}

/**
 * Helper: Simulate turn change
 */
export function simulateTurnChange(
  socket: MockWebSocket,
  currentPlayerId: string,
  timeRemaining: number = 15
): void {
  socket.simulateServerEvent('turnChanged', {
    currentPlayerId,
    timeRemaining,
  } as MockTurnChangedPayload)
}

/**
 * Helper: Simulate timer countdown
 */
export function simulateTimerUpdate(socket: MockWebSocket, timeRemaining: number): void {
  socket.simulateServerEvent('timerUpdate', {
    timeRemaining,
  } as MockTimerUpdatePayload)
}

/**
 * Helper: Simulate disconnect
 */
export function simulateDisconnect(socket: MockWebSocket): void {
  socket.disconnect()
}

/**
 * Helper: Simulate reconnect
 */
export function simulateReconnect(socket: MockWebSocket): void {
  socket.connect()
}

/**
 * Create a vi.fn() mock socket for dependency injection
 */
export function createMockSocketService(): {
  socket: MockWebSocket
  mockService: any
} {
  const socket = new MockWebSocket()

  const mockService = {
    getSocket: vi.fn(() => socket),
    connect: vi.fn(() => socket.connect()),
    disconnect: vi.fn(() => socket.disconnect()),
    emit: vi.fn((event: string, data: any) => socket.emit(event, data)),
    on: vi.fn((event: string, callback: Function) => socket.on(event, callback)),
    off: vi.fn((event: string, callback?: Function) => socket.off(event, callback)),
  }

  return { socket, mockService }
}
