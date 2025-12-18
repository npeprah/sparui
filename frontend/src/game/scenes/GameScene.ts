import Phaser from 'phaser'
import { CardSprite } from '../sprites/CardSprite'
import type { Suit, Rank, Card } from '../../store/types'
import { CARD_SCALES, CARD_DIMENSIONS } from '../constants/cards'
import {
  createDealAnimation,
  createPlayAnimation,
  calculateDealStagger,
} from '../utils/animations'
import { emitSoundEvent, triggerHaptic } from '../constants/animations'
import { useGameStore } from '../../store/gameStore'
import { usePlayerStore } from '../../store/playerStore'
import { mapPlayersToPositions, type PlayerPosition } from '../utils/playerPositions'
import { getPlayableCards } from '../utils/sparRules'
import { socketService } from '../../services/socketService'
import type { ServerToClientEvents } from '../../services/socketService'
import { createFPSCounter, type FPSCounter } from '../utils/fpsCounter'
import {
  createConfettiEffect,
  createSparkleEffect,
  cleanupParticleEmitters,
  isMobileDevice,
} from '../utils/particles'


/**
 * Layout configuration for different screen sizes
 */
interface LayoutConfig {
  cardScale: number
  handSpacing: number
  playAreaSize: number
}

/**
 * Main game scene - handles card display, interaction, and gameplay
 */
export class GameScene extends Phaser.Scene {
  // Depth constants for z-index ordering
  private static readonly BASE_PLAYED_CARD_DEPTH = 1000

  // Player hands (bottom = current player)
  private playerHands: Map<PlayerPosition, CardSprite[]> = new Map()

  // Cards in play area (center of table)
  private playedCards: Map<PlayerPosition, CardSprite> = new Map()

  // Depth counter for played cards (tracks number of cards played in current round)
  private playedCardDepthCounter: number = 0

  // Layout configuration
  private layout: LayoutConfig = {
    cardScale: CARD_SCALES.HAND,
    handSpacing: 20,
    playAreaSize: 300,
  }

  // Selected card
  private selectedCard: CardSprite | null = null

  // Store subscriptions
  private gameStoreUnsubscribe?: () => void
  private playerStoreUnsubscribe?: () => void

  // Player position mapping (position -> player ID)
  private positionMap: Map<PlayerPosition, string> = new Map()

  // WebSocket event handlers (stored for cleanup)
  private socketHandlers: Map<keyof ServerToClientEvents, any> = new Map()

  // FPS counter (dev mode only)
  private fpsCounter: FPSCounter | null = null

  // Active particle emitters (for cleanup)
  private activeParticleEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = []

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this.setupLayout()
    this.createBackground()
    this.createPlayArea()
    this.setupResponsive()

    // Create FPS counter (dev mode only)
    this.fpsCounter = createFPSCounter(this)

    // Initialize empty hands
    this.playerHands.set('bottom', [])
    this.playerHands.set('left', [])
    this.playerHands.set('top', [])
    this.playerHands.set('right', [])

    // Setup state subscriptions
    this.setupStateSubscriptions()

    // Setup WebSocket event listeners
    this.setupWebSocketListeners()

    // Test: Deal 5 cards to bottom player (for MVP testing)
    // This will be removed once WebSocket integration is complete
    this.dealTestHand()
  }

  /**
   * Update loop - called every frame
   */
  update() {
    // Update FPS counter (dev mode only)
    this.fpsCounter?.update()
  }

  /**
   * Cleanup when scene is shut down
   */
  shutdown() {
    this.cleanupSubscriptions()
    this.fpsCounter?.destroy()

    // Cleanup active particle emitters
    this.activeParticleEmitters.forEach((emitter) => {
      if (emitter && emitter.active) {
        emitter.stop()
        emitter.destroy()
      }
    })
    this.activeParticleEmitters = []
  }

  /**
   * Setup layout configuration based on screen size
   */
  private setupLayout(): void {
    const { width, height } = this.cameras.main

    // Mobile portrait
    if (width < 768 && height > width) {
      this.layout.cardScale = CARD_SCALES.MOBILE_HAND
      this.layout.handSpacing = 15
      this.layout.playAreaSize = 200
    }
    // Tablet
    else if (width < 1024) {
      this.layout.cardScale = CARD_SCALES.HAND * 0.8
      this.layout.handSpacing = 18
      this.layout.playAreaSize = 250
    }
    // Desktop
    else {
      this.layout.cardScale = CARD_SCALES.HAND
      this.layout.handSpacing = 20
      this.layout.playAreaSize = 300
    }
  }

  /**
   * Create game table background
   */
  private createBackground(): void {
    const { width, height } = this.cameras.main

    // Table surface - rich green felt
    const background = this.add.rectangle(width / 2, height / 2, width, height, 0x0a5f38)
    background.setDepth(-10)

    // Subtle texture overlay (pattern)
    const graphics = this.add.graphics()
    graphics.fillStyle(0x000000, 0.05)
    for (let x = 0; x < width; x += 40) {
      for (let y = 0; y < height; y += 40) {
        graphics.fillCircle(x, y, 2)
      }
    }
    graphics.setDepth(-9)

    // Table title
    const title = this.add.text(width / 2, 40, 'SPAR', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '48px',
      color: '#FFD700',
      fontStyle: 'bold',
    })
    title.setOrigin(0.5)
    title.setDepth(100)
  }

  /**
   * Create center play area where cards are played
   */
  private createPlayArea(): void {
    const { width, height } = this.cameras.main
    const centerX = width / 2
    const centerY = height / 2

    // Play area background (darker circle)
    const playArea = this.add.circle(
      centerX,
      centerY,
      this.layout.playAreaSize / 2,
      0x064529,
      0.8
    )
    playArea.setDepth(-5)

    // Play area border (gold)
    const border = this.add.graphics()
    border.lineStyle(4, 0xffd700, 0.6)
    border.strokeCircle(centerX, centerY, this.layout.playAreaSize / 2)
    border.setDepth(-4)

    // Player position labels (for MVP testing)
    this.addPositionLabel('bottom', centerX, centerY + this.layout.playAreaSize / 2 - 30)
    this.addPositionLabel('left', centerX - this.layout.playAreaSize / 2 + 60, centerY)
    this.addPositionLabel('top', centerX, centerY - this.layout.playAreaSize / 2 + 30)
    this.addPositionLabel('right', centerX + this.layout.playAreaSize / 2 - 60, centerY)
  }

  /**
   * Add position label to play area (for testing)
   */
  private addPositionLabel(position: PlayerPosition, x: number, y: number): void {
    const label = this.add.text(x, y, position.toUpperCase(), {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#FFD700',
      fontStyle: 'bold',
    })
    label.setOrigin(0.5)
    label.setAlpha(0.4)
    label.setDepth(-3)
  }

  /**
   * Setup responsive resize handling
   */
  private setupResponsive(): void {
    this.scale.on('resize', this.onResize, this)
  }

  /**
   * Handle window resize
   */
  private onResize(_gameSize: Phaser.Structs.Size): void {
    // Recalculate layout
    this.setupLayout()

    // Reposition hands
    this.repositionAllHands()
  }

  /**
   * Get position for player hand based on position
   */
  private getHandPosition(position: PlayerPosition): { x: number; y: number; rotation: number } {
    const { width, height } = this.cameras.main
    const centerX = width / 2
    const centerY = height / 2
    const margin = 50

    switch (position) {
      case 'bottom':
        return { x: centerX, y: height - margin, rotation: 0 }
      case 'left':
        return { x: margin, y: centerY, rotation: Math.PI / 2 }
      case 'top':
        return { x: centerX, y: margin, rotation: Math.PI }
      case 'right':
        return { x: width - margin, y: centerY, rotation: -Math.PI / 2 }
    }
  }

  /**
   * Deal a test hand to bottom player (for MVP testing)
   */
  private dealTestHand(): void {
    const testCards: Array<{ suit: Suit; rank: Rank }> = [
      { suit: 'hearts', rank: '6' },
      { suit: 'hearts', rank: '7' },
      { suit: 'clubs', rank: 'J' },
      { suit: 'diamonds', rank: 'K' },
      { suit: 'spades', rank: '9' },
    ]

    testCards.forEach((cardData, index) => {
      setTimeout(() => {
        this.dealCardToPlayer('bottom', cardData.suit, cardData.rank, 'player-1')
      }, index * 150) // Stagger dealing
    })
  }

  /**
   * Deal a card to a player's hand
   */
  public dealCardToPlayer(
    position: PlayerPosition,
    suit: Suit,
    rank: Rank,
    owner: string,
    cardId?: string
  ): CardSprite {
    // Create card at deck position (top center)
    const deckX = this.cameras.main.width / 2
    const deckY = 100

    const card = new CardSprite(this, deckX, deckY, suit, rank, owner)

    // Override cardId if provided (for store sync)
    if (cardId) {
      ;(card as any).cardId = cardId
    }

    card.setScale(this.layout.cardScale)
    card.setFaceDown(true)

    // Add to hand
    const hand = this.playerHands.get(position) || []
    hand.push(card)
    this.playerHands.set(position, hand)

    // Animate to hand position
    this.animateCardToHand(card, position, hand.length - 1)

    // Setup card click handler (for click/tap without drag)
    card.onCardClick = (clickedCard) => this.onCardClicked(clickedCard)

    // Setup card drag handler (for drag-to-play gesture)
    card.onCardDragPlay = (draggedCard) => this.onCardDraggedToPlay(draggedCard)

    return card
  }

  /**
   * Animate card from deck to player hand
   * Uses new animation utilities with rotation and sound effects
   */
  private animateCardToHand(card: CardSprite, position: PlayerPosition, index: number): void {
    const handPosition = this.getHandPosition(position)
    const handCards = this.playerHands.get(position) || []
    const totalCards = handCards.length

    // Calculate card position in hand (fanned out)
    const cardWidth = CARD_DIMENSIONS.WIDTH * this.layout.cardScale
    const totalWidth = (totalCards - 1) * (cardWidth + this.layout.handSpacing)
    const startX = handPosition.x - totalWidth / 2
    const targetX = startX + index * (cardWidth + this.layout.handSpacing)
    const targetY = handPosition.y

    // Calculate stagger delay
    const delay = calculateDealStagger(index)

    // Create deal animation with rotation
    const dealConfig = createDealAnimation(card, targetX, targetY, delay)

    // Add animation with sound effect and completion callback
    this.tweens.add({
      ...dealConfig,
      onStart: () => {
        // Emit sound event for card deal
        emitSoundEvent(this, 'CARD_DEAL')
      },
      onComplete: () => {
        // Flip face up if bottom player
        if (position === 'bottom') {
          card.setFaceDown(false)
          card.setPlayable(true) // Make playable for testing
        }
        card.updateOriginalY(targetY)

        // Haptic feedback on mobile for bottom player
        if (position === 'bottom') {
          triggerHaptic('LIGHT')
        }
      },
    })
  }

  /**
   * Reposition all hands (after resize or card changes)
   */
  private repositionAllHands(): void {
    this.playerHands.forEach((hand, position) => {
      hand.forEach((card, index) => {
        const handPosition = this.getHandPosition(position)
        const cardWidth = CARD_DIMENSIONS.WIDTH * this.layout.cardScale
        const totalWidth = (hand.length - 1) * (cardWidth + this.layout.handSpacing)
        const startX = handPosition.x - totalWidth / 2
        const targetX = startX + index * (cardWidth + this.layout.handSpacing)

        card.setPosition(targetX, handPosition.y)
        card.updateOriginalY(handPosition.y)
        card.setScale(this.layout.cardScale)

        // Set depth so cards to the right overlap cards to the left
        // Higher index = higher depth = appears on top and receives pointer events
        card.setDepth(index)
      })
    })
  }

  /**
   * Handle card click (fallback for desktop/non-drag input)
   */
  private onCardClicked(card: CardSprite): void {
    // Deselect previous card
    if (this.selectedCard && this.selectedCard !== card) {
      this.selectedCard.setSelected(false)
    }

    // Toggle selection
    const isSelected = !card.selected
    card.setSelected(isSelected)

    this.selectedCard = isSelected ? card : null

    // If selected, play the card (for MVP testing)
    if (isSelected) {
      setTimeout(() => {
        this.playCard(card, 'bottom')
      }, 300)
    }
  }

  /**
   * Handle card drag-to-play gesture (mobile/touch alternative)
   */
  private onCardDraggedToPlay(card: CardSprite): void {
    // Deselect any selected card
    if (this.selectedCard) {
      this.selectedCard.setSelected(false)
      this.selectedCard = null
    }

    // Play the card immediately (no selection state)
    this.playCard(card, 'bottom')
  }

  /**
   * Play a card to the center play area
   * Uses new animation utilities with sound effects and haptic feedback
   */
  private playCard(card: CardSprite, fromPosition: PlayerPosition): void {
    // Remove from hand
    const hand = this.playerHands.get(fromPosition) || []
    const cardIndex = hand.indexOf(card)
    if (cardIndex >= 0) {
      hand.splice(cardIndex, 1)
    }

    // Deselect and disable, but maintain full visibility
    card.setSelected(false)
    card.setPlayable(false, true) // maintainVisibility = true for played cards

    // Set depth to ensure proper stacking (higher = on top)
    // Each played card should appear above previous cards
    const cardDepth = GameScene.BASE_PLAYED_CARD_DEPTH + this.playedCardDepthCounter
    card.setDepth(cardDepth)
    this.playedCardDepthCounter++

    // Calculate target position in play area
    const { width, height } = this.cameras.main
    const centerX = width / 2
    const centerY = height / 2

    // Position based on player position
    const playOffset = 80
    let targetX = centerX
    let targetY = centerY

    switch (fromPosition) {
      case 'bottom':
        targetY += playOffset
        break
      case 'left':
        targetX -= playOffset
        break
      case 'top':
        targetY -= playOffset
        break
      case 'right':
        targetX += playOffset
        break
    }

    // Create play animation with random rotation
    const playConfig = createPlayAnimation(card, targetX, targetY, CARD_SCALES.PLAYED)

    // Add animation with sound effect and haptic feedback
    this.tweens.add({
      ...playConfig,
      onStart: () => {
        // Emit sound event for card play
        emitSoundEvent(this, 'CARD_PLAY')

        // Haptic feedback on mobile for bottom player
        if (fromPosition === 'bottom') {
          triggerHaptic('CARD_PLAY')
        }
      },
    })

    // Store in played cards
    this.playedCards.set(fromPosition, card)

    // Reposition remaining hand
    this.repositionAllHands()
  }

  /**
   * Clear all played cards (for next round)
   */
  public clearPlayedCards(): void {
    this.playedCards.forEach((card) => {
      card.destroy()
    })
    this.playedCards.clear()

    // Reset depth counter for next round
    this.playedCardDepthCounter = 0
  }

  /**
   * Get current player hand (bottom position)
   */
  public getCurrentPlayerHand(): CardSprite[] {
    return this.playerHands.get('bottom') || []
  }

  /**
   * Setup subscriptions to Zustand stores
   */
  private setupStateSubscriptions(): void {
    // Subscribe to player store (hand changes)
    this.playerStoreUnsubscribe = usePlayerStore.subscribe((state) => {
      this.syncPlayerHand(state.hand)
    })

    // Subscribe to game store (game state changes)
    this.gameStoreUnsubscribe = useGameStore.subscribe((state) => {
      // Update player position mapping when players change
      const currentPlayerId = usePlayerStore.getState().playerId
      if (state.players.length > 0 && currentPlayerId) {
        this.positionMap = mapPlayersToPositions(state.players, currentPlayerId)
      }

      // Update playable cards when current suit changes
      this.updatePlayableCards(state.currentSuit)
    })

    // Initial sync
    const playerState = usePlayerStore.getState()
    const gameState = useGameStore.getState()

    if (gameState.players.length > 0 && playerState.playerId) {
      this.positionMap = mapPlayersToPositions(gameState.players, playerState.playerId)
    }

    this.syncPlayerHand(playerState.hand)
    this.updatePlayableCards(gameState.currentSuit)
  }

  /**
   * Cleanup store subscriptions
   */
  private cleanupSubscriptions(): void {
    this.gameStoreUnsubscribe?.()
    this.playerStoreUnsubscribe?.()
    this.cleanupWebSocketListeners()
  }

  /**
   * Sync player hand from store to display
   */
  private syncPlayerHand(hand: Card[]): void {
    const currentHand = this.playerHands.get('bottom') || []

    // Remove cards no longer in hand
    currentHand.forEach((cardSprite) => {
      const stillInHand = hand.some((c) => c.id === cardSprite.cardId)
      if (!stillInHand) {
        cardSprite.destroy()
      }
    })

    // Filter out destroyed cards
    const remainingCards = currentHand.filter((c) => !c.scene || c.active)

    // Add new cards
    hand.forEach((card, index) => {
      const alreadyExists = remainingCards.some((c) => c.cardId === card.id)
      if (!alreadyExists) {
        const cardSprite = this.dealCardToPlayer(
          'bottom',
          card.suit,
          card.rank,
          usePlayerStore.getState().playerId,
          card.id // Pass card ID for proper tracking
        )
        remainingCards.splice(index, 0, cardSprite)
      }
    })

    // Update hand reference
    this.playerHands.set('bottom', remainingCards)

    // Reposition all cards
    this.repositionAllHands()
  }

  /**
   * Update which cards are playable based on game rules
   */
  private updatePlayableCards(currentSuit: string | null): void {
    const hand = this.playerHands.get('bottom') || []
    const playerHand = usePlayerStore.getState().hand
    const isMyTurn = usePlayerStore.getState().isMyTurn

    if (!isMyTurn) {
      // Not our turn, no cards are playable
      hand.forEach((card) => card.setPlayable(false))
      return
    }

    // Get playable cards based on Spar rules
    const playableCards = getPlayableCards(playerHand, currentSuit as any)
    const playableIds = new Set(playableCards.map((c) => c.id))

    // Update card sprites
    hand.forEach((cardSprite) => {
      const isPlayable = playableIds.has(cardSprite.cardId)
      cardSprite.setPlayable(isPlayable)
    })
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupWebSocketListeners(): void {
    const socket = socketService.getSocket()
    if (!socket) {
      console.warn('Socket not connected, skipping event listener setup')
      return
    }

    // gameStarted - Game begins
    const gameStartedHandler: ServerToClientEvents['gameStarted'] = (data) => {
      useGameStore.getState().setGamePhase('playing')
      useGameStore.getState().setRoundPhase('playing')
      useGameStore.getState().setLeader(data.leaderId)

      console.log('[GameScene] Game started:', data)
    }
    socket.on('gameStarted', gameStartedHandler)
    this.socketHandlers.set('gameStarted', gameStartedHandler)

    // cardPlayed - A player played a card
    const cardPlayedHandler: ServerToClientEvents['cardPlayed'] = (data) => {
      const { playerId, card } = data

      // Update game state
      useGameStore.getState().playCard(playerId, card)

      // If it's the current player, remove from hand
      if (playerId === usePlayerStore.getState().playerId) {
        usePlayerStore.getState().removeCardFromHand(card.id)
      } else {
        // Animate opponent card play
        const position = this.getPlayerPositionById(playerId)
        if (position) {
          // In a real implementation, we'd animate the card from opponent position
          console.log(`[GameScene] Player at ${position} played ${card.suit} ${card.rank}`)
        }
      }

      console.log('[GameScene] Card played:', data)
    }
    socket.on('cardPlayed', cardPlayedHandler)
    this.socketHandlers.set('cardPlayed', cardPlayedHandler)

    // roundWon - Round finished, someone won
    const roundWonHandler: ServerToClientEvents['roundWon'] = (data) => {
      const { winnerId, points, isDry, isShowDry } = data

      // Update scores
      useGameStore.getState().updateScore(winnerId, points)

      // Update win streaks
      const players = useGameStore.getState().players
      players.forEach((player) => {
        if (player.id === winnerId) {
          useGameStore.getState().incrementWinStreak(player.id)
        } else {
          useGameStore.getState().resetWinStreak(player.id)
        }
      })

      // Animate win/lose effects
      const winnerPosition = this.getPlayerPositionById(winnerId)
      let winnerCard: CardSprite | undefined
      if (winnerPosition) {
        winnerCard = this.playedCards.get(winnerPosition)
        if (winnerCard) {
          winnerCard.animateWin()
        }
      }

      // Animate lose effects for other cards
      this.playedCards.forEach((card, position) => {
        const positionPlayerId = this.getPlayerIdByPosition(position)
        if (positionPlayerId !== winnerId) {
          card.animateLose()
        }
      })

      // Trigger confetti particles for winner
      if (winnerCard) {
        const isMobile = isMobileDevice(this)
        const confettiEmitters = createConfettiEffect(this, {
          x: winnerCard.x,
          y: winnerCard.y,
          quantity: 30,
          isMobile,
        })
        this.activeParticleEmitters.push(...confettiEmitters)

        // Also add sparkles
        const sparkleEmitter = createSparkleEffect(this, {
          x: winnerCard.x,
          y: winnerCard.y,
          quantity: 15,
          isMobile,
        })
        this.activeParticleEmitters.push(sparkleEmitter)

        // Cleanup particles after animation
        cleanupParticleEmitters([...confettiEmitters, sparkleEmitter], 2000)
      }

      // Wait for animations, then clean up
      setTimeout(() => {
        this.clearPlayedCards()
        useGameStore.getState().nextRound()
      }, 2000)

      console.log('[GameScene] Round won:', { winnerId, points, isDry, isShowDry })
    }
    socket.on('roundWon', roundWonHandler)
    this.socketHandlers.set('roundWon', roundWonHandler)

    // gameEnded - Game finished
    const gameEndedHandler: ServerToClientEvents['gameEnded'] = (data) => {
      const { winnerId, finalScores } = data

      useGameStore.getState().setGamePhase('finished')

      console.log('[GameScene] Game ended:', { winnerId, finalScores })

      // In a real implementation, we'd show game over screen
      // For now, just log it
    }
    socket.on('gameEnded', gameEndedHandler)
    this.socketHandlers.set('gameEnded', gameEndedHandler)

    // turnChanged - Turn switched to another player
    const turnChangedHandler: ServerToClientEvents['turnChanged'] = (data) => {
      const { currentPlayerId, timeRemaining } = data

      // Update whose turn it is
      const isMyTurn = currentPlayerId === usePlayerStore.getState().playerId
      usePlayerStore.getState().setIsMyTurn(isMyTurn)

      // Update timer
      useGameStore.getState().setTimeRemaining(timeRemaining)

      console.log('[GameScene] Turn changed:', { currentPlayerId, isMyTurn, timeRemaining })
    }
    socket.on('turnChanged', turnChangedHandler)
    this.socketHandlers.set('turnChanged', turnChangedHandler)

    // timerUpdate - Timer countdown
    const timerUpdateHandler: ServerToClientEvents['timerUpdate'] = (data) => {
      useGameStore.getState().setTimeRemaining(data.timeRemaining)
    }
    socket.on('timerUpdate', timerUpdateHandler)
    this.socketHandlers.set('timerUpdate', timerUpdateHandler)
  }

  /**
   * Cleanup WebSocket event listeners
   */
  private cleanupWebSocketListeners(): void {
    const socket = socketService.getSocket()
    if (!socket) return

    this.socketHandlers.forEach((handler, event) => {
      socket.off(event, handler)
    })

    this.socketHandlers.clear()
  }

  /**
   * Get position for a player ID
   */
  private getPlayerPositionById(playerId: string): PlayerPosition | undefined {
    for (const [position, id] of this.positionMap.entries()) {
      if (id === playerId) {
        return position
      }
    }
    return undefined
  }

  /**
   * Get player ID for a position
   */
  private getPlayerIdByPosition(position: PlayerPosition): string | undefined {
    return this.positionMap.get(position)
  }
}
