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
import { AudioManager } from '../../services/audioManager'


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

  // Scene initialization flag (prevents race conditions)
  private isSceneReady: boolean = false

  // Player info UI elements (scoreboard in top-left corner)
  private scoreboardContainer: Phaser.GameObjects.Container | null = null
  private playerScoreRows: Map<string, {
    container: Phaser.GameObjects.Container
    nameText: Phaser.GameObjects.Text
    scoreText: Phaser.GameObjects.Text
    turnIndicator: Phaser.GameObjects.Graphics
    leaderIcon: Phaser.GameObjects.Text
  }> = new Map()

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    console.log('[GameScene] ===== CREATE METHOD CALLED =====')
    console.log('[GameScene] Timestamp:', new Date().toISOString())

    this.setupLayout()
    this.createBackground()
    this.createPlayArea()
    this.createPlayerInfoDisplays()
    this.setupResponsive()

    // Initialize AudioManager
    this.setupAudioManager()

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

    console.log('[GameScene] About to call dealCardsFromBackendState()')

    // Deal cards from backend game state (if available)
    this.dealCardsFromBackendState()

    // Mark scene as ready (prevents race conditions with early store/socket events)
    this.isSceneReady = true

    console.log('[GameScene] CREATE METHOD COMPLETE - Scene is now ready')
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

    // Cleanup AudioManager
    const audioManager = AudioManager.getInstance()
    audioManager.destroy()

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
   * Create scoreboard panel in top-left corner showing all players' info
   */
  private createPlayerInfoDisplays(): void {
    // Create main scoreboard container in top-left
    this.scoreboardContainer = this.add.container(20, 80)
    this.scoreboardContainer.setDepth(500)

    // Scoreboard background
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.7)
    bg.fillRoundedRect(0, 0, 220, 30, 8) // Will be resized when players added
    this.scoreboardContainer.add(bg)

    // Scoreboard title
    const title = this.add.text(110, 15, 'ROUNDS WON', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#FFD700',
      fontStyle: 'bold',
    })
    title.setOrigin(0.5)
    this.scoreboardContainer.add(title)
  }

  /**
   * Update player info displays based on current game state
   */
  private updatePlayerInfoDisplays(): void {
    if (!this.isSceneReady || !this.scoreboardContainer) return

    const gameState = useGameStore.getState()
    const playerState = usePlayerStore.getState()
    const currentPlayerId = playerState.playerId
    const isMyTurn = playerState.isMyTurn

    // Find the leader (highest score)
    let leaderId: string | null = null
    let highestScore = -1
    gameState.players.forEach((player) => {
      if (player.score > highestScore) {
        highestScore = player.score
        leaderId = player.id
      }
    })

    // Check if there's a tie for lead
    const playersAtHighestScore = gameState.players.filter((p) => p.score === highestScore)
    const hasTie = playersAtHighestScore.length > 1

    // Create or update player rows
    const rowHeight = 35
    const startY = 40

    gameState.players.forEach((player, index) => {
      let row = this.playerScoreRows.get(player.id)

      if (!row) {
        // Create new row for this player
        const rowContainer = this.add.container(0, startY + index * rowHeight)
        this.scoreboardContainer!.add(rowContainer)

        // Turn indicator background
        const turnIndicator = this.add.graphics()
        rowContainer.add(turnIndicator)

        // Player name
        const nameText = this.add.text(10, 10, '', {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: '#FFFFFF',
          fontStyle: 'bold',
        })
        nameText.setOrigin(0, 0.5)
        rowContainer.add(nameText)

        // Score
        const scoreText = this.add.text(170, 10, '', {
          fontFamily: 'Orbitron, Arial',
          fontSize: '16px',
          color: '#FFD700',
          fontStyle: 'bold',
        })
        scoreText.setOrigin(0, 0.5)
        rowContainer.add(scoreText)

        // Leader icon
        const leaderIcon = this.add.text(205, 10, '👑', {
          fontSize: '14px',
        })
        leaderIcon.setOrigin(0.5)
        leaderIcon.setVisible(false)
        rowContainer.add(leaderIcon)

        row = { container: rowContainer, nameText, scoreText, turnIndicator, leaderIcon }
        this.playerScoreRows.set(player.id, row)
      }

      // Update row position (in case players changed)
      row.container.setY(startY + index * rowHeight)

      // Update name
      const isCurrentPlayer = player.id === currentPlayerId
      let displayName = player.name
      if (isCurrentPlayer) {
        displayName = `${player.name} (YOU)`
      }
      row.nameText.setText(displayName)
      row.nameText.setColor(isCurrentPlayer ? '#00FF00' : '#FFFFFF')

      // Update score
      row.scoreText.setText(`${player.score}`)

      // Determine if it's this player's turn
      const isThisPlayersTurn = (isCurrentPlayer && isMyTurn) ||
                                 (!isCurrentPlayer && !isMyTurn && this.isPlayersTurn(player.id))

      // Update turn indicator
      row.turnIndicator.clear()
      if (isThisPlayersTurn) {
        row.turnIndicator.fillStyle(0x00ff00, 0.25)
        row.turnIndicator.fillRoundedRect(0, -5, 220, 30, 5)
        row.turnIndicator.lineStyle(2, 0x00ff00, 0.8)
        row.turnIndicator.strokeRoundedRect(0, -5, 220, 30, 5)

        // Add turn arrow
        row.nameText.setText(`▶ ${displayName}`)
      }

      // Update leader icon
      const isLeader = player.id === leaderId && !hasTie && highestScore > 0
      row.leaderIcon.setVisible(isLeader)
    })

    // Update scoreboard background size
    const totalHeight = 40 + gameState.players.length * rowHeight + 10
    const bgGraphics = this.scoreboardContainer.getAt(0) as Phaser.GameObjects.Graphics
    bgGraphics.clear()
    bgGraphics.fillStyle(0x000000, 0.7)
    bgGraphics.fillRoundedRect(0, 0, 220, totalHeight, 8)
    bgGraphics.lineStyle(2, 0xffd700, 0.5)
    bgGraphics.strokeRoundedRect(0, 0, 220, totalHeight, 8)
  }

  /**
   * Check if a specific player ID is the current turn player
   */
  private isPlayersTurn(playerId: string | undefined): boolean {
    if (!playerId) return false

    const gameState = useGameStore.getState()

    // If no cards played yet, it's the leader's turn
    if (gameState.playedCards.size === 0) {
      return playerId === gameState.leaderId
    }

    // Otherwise, check if this player has already played this round
    const hasPlayed = gameState.playedCards.has(playerId)
    return !hasPlayed
  }

  /**
   * Setup AudioManager and initialize audio system
   */
  private setupAudioManager(): void {
    const audioManager = AudioManager.getInstance()
    audioManager.init(this)
    console.log('GameScene: AudioManager initialized with 16 sounds')
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
   * Returns null if camera is not yet initialized (prevents race conditions)
   */
  private getHandPosition(position: PlayerPosition): { x: number; y: number; rotation: number } | null {
    // Guard against camera not being ready (can happen during scene initialization)
    if (!this.cameras || !this.cameras.main) {
      console.warn('[GameScene] Camera not ready in getHandPosition, returning null')
      return null
    }

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
  /**
   * Deal cards from backend game state
   * This method reads the current player's hand from the game store
   * and deals those cards to the player's position on screen
   */
  private dealCardsFromBackendState(): void {
    console.log('[GameScene] ===== DEALING CARDS FROM BACKEND STATE =====')

    const gameState = useGameStore.getState()
    const playerState = usePlayerStore.getState()
    const currentPlayerId = playerState.playerId

    console.log('[GameScene] Current player ID:', currentPlayerId)
    console.log('[GameScene] Game state players:', gameState.players)
    console.log('[GameScene] Number of players in game state:', gameState.players.length)
    console.log('[GameScene] Game phase:', gameState.gamePhase)
    console.log('[GameScene] Room code:', gameState.roomCode)

    // Log all players in game state
    gameState.players.forEach((player, index) => {
      console.log(`[GameScene] Player ${index}:`, {
        id: player.id,
        name: player.name,
        handSize: player.hand?.length || 0,
        hasHand: !!player.hand,
      })
    })

    // Find current player in game state
    const currentPlayer = gameState.players.find((p) => p.id === currentPlayerId)

    console.log('[GameScene] Looking for player with ID:', currentPlayerId)
    console.log('[GameScene] Found current player:', currentPlayer)

    if (!currentPlayer) {
      console.error('[GameScene] ERROR: Current player not found in game state!')
      console.error('[GameScene] Current player ID:', currentPlayerId)
      console.error('[GameScene] Available player IDs:', gameState.players.map((p) => p.id))
      console.warn('[GameScene] Falling back to test hand')
      this.dealTestHand()
      return
    }

    if (!currentPlayer.hand || currentPlayer.hand.length === 0) {
      console.error('[GameScene] ERROR: Current player has no hand!')
      console.error('[GameScene] Current player:', currentPlayer)
      console.warn('[GameScene] Falling back to test hand')
      this.dealTestHand()
      return
    }

    console.log('[GameScene] Current player hand:', currentPlayer.hand)
    console.log('[GameScene] Hand size:', currentPlayer.hand.length)

    // Deal cards with staggered animation
    currentPlayer.hand.forEach((card, index) => {
      console.log(`[GameScene] Scheduling deal for card ${index}:`, card)
      setTimeout(() => {
        console.log(`[GameScene] Dealing card ${index}:`, card)
        this.dealCardToPlayer('bottom', card.suit, card.rank, currentPlayerId, card.id)
      }, index * 150) // Stagger dealing for nice animation
    })

    console.log(`[GameScene] Scheduled ${currentPlayer.hand.length} cards for dealing`)
  }

  /**
   * Deal test hand (fallback for development/testing)
   * @deprecated Use dealCardsFromBackendState() instead
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
    console.log(`[GameScene] dealCardToPlayer called: ${suit} ${rank} to ${position} (owner: ${owner})`)

    // Create card at deck position (top center)
    const deckX = this.cameras.main.width / 2
    const deckY = 100

    console.log(`[GameScene] Creating CardSprite at (${deckX}, ${deckY})`)
    const card = new CardSprite(this, deckX, deckY, suit, rank, owner)

    // Override cardId if provided (for store sync)
    if (cardId) {
      ;(card as any).cardId = cardId
      console.log(`[GameScene] Set cardId: ${cardId}`)
    }

    card.setScale(this.layout.cardScale)
    card.setFaceDown(true)
    console.log(`[GameScene] Card scale set to ${this.layout.cardScale}, face down`)

    // Add to hand
    const hand = this.playerHands.get(position) || []
    hand.push(card)
    this.playerHands.set(position, hand)
    console.log(`[GameScene] Added card to ${position} hand (now ${hand.length} cards)`)

    // Animate to hand position
    this.animateCardToHand(card, position, hand.length - 1)

    // Setup card click handler (for click/tap without drag)
    card.onCardClick = (clickedCard) => this.onCardClicked(clickedCard)

    // Setup card drag handler (for drag-to-play gesture)
    card.onCardDragPlay = (draggedCard) => this.onCardDraggedToPlay(draggedCard)

    console.log(`[GameScene] Card ${suit} ${rank} setup complete`)
    return card
  }

  /**
   * Animate card from deck to player hand
   * Uses new animation utilities with rotation and sound effects
   */
  private animateCardToHand(card: CardSprite, position: PlayerPosition, index: number): void {
    const handPosition = this.getHandPosition(position)

    // Guard against camera not being ready
    if (!handPosition) {
      console.warn('[GameScene] Cannot animate card to hand - camera not ready')
      return
    }

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
    // Guard against camera not being ready (can happen during scene initialization)
    if (!this.isSceneReady || !this.cameras || !this.cameras.main) {
      console.warn('[GameScene] Camera not ready, skipping repositionAllHands')
      return
    }

    this.playerHands.forEach((hand, position) => {
      hand.forEach((card, index) => {
        const handPosition = this.getHandPosition(position)

        // Skip if camera still not ready (double check)
        if (!handPosition) {
          return
        }

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
    console.log('[GameScene] playCard called:', card.suit, card.rank, 'from', fromPosition)

    // Emit card play event to backend (only if current player)
    if (fromPosition === 'bottom') {
      const cardData: Card = {
        suit: card.suit,
        rank: card.rank,
        id: card.cardId,
      }

      console.log('[GameScene] Emitting game:play_card event:', cardData)
      socketService.emit('game:play_card', { card: cardData })
    }

    // IMPORTANT: Do NOT manually remove from playerHands Map here!
    // The store is the single source of truth. When the cardPlayed event
    // comes back from the server, it will trigger removeCardFromHand()
    // on the store, which will trigger syncPlayerHand() to update the display.
    //
    // For opponents, we don't track their hands in the store, so we DO remove
    // from the Map after animation completes (see below).

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
      onComplete: () => {
        // For opponent cards (not bottom), remove from hand Map after animation
        // Bottom player cards are removed via store subscription in syncPlayerHand()
        if (fromPosition !== 'bottom') {
          const hand = this.playerHands.get(fromPosition) || []
          const cardIndex = hand.indexOf(card)
          if (cardIndex >= 0) {
            console.log(`[GameScene] Removing opponent card from ${fromPosition} hand after animation`)
            hand.splice(cardIndex, 1)
            this.playerHands.set(fromPosition, hand)
          }
        }
      },
    })

    // Store in played cards
    this.playedCards.set(fromPosition, card)

    // Reposition remaining hand (for opponents only)
    // Bottom player hand will be repositioned by syncPlayerHand() when store updates
    if (fromPosition !== 'bottom') {
      this.repositionAllHands()
    }
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
    // Subscribe to player store (hand changes and turn changes)
    this.playerStoreUnsubscribe = usePlayerStore.subscribe((state) => {
      this.syncPlayerHand(state.hand)
      // Update player info when turn changes
      this.updatePlayerInfoDisplays()
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

      // Update player info displays (scores, turn, leader)
      this.updatePlayerInfoDisplays()
    })

    // Initial sync
    const playerState = usePlayerStore.getState()
    const gameState = useGameStore.getState()

    if (gameState.players.length > 0 && playerState.playerId) {
      this.positionMap = mapPlayersToPositions(gameState.players, playerState.playerId)
    }

    this.syncPlayerHand(playerState.hand)
    this.updatePlayableCards(gameState.currentSuit)
    this.updatePlayerInfoDisplays()
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
    // Guard against scene not being ready (can happen during initialization)
    if (!this.isSceneReady) {
      console.warn('[GameScene] Scene not fully initialized, deferring syncPlayerHand')
      return
    }

    const currentHand = this.playerHands.get('bottom') || []

    console.log('[GameScene] syncPlayerHand called')
    console.log('  - Store hand cards:', hand.map(c => `${c.suit} ${c.rank} (${c.id})`))
    console.log('  - Current displayed cards:', currentHand.map(c => `${c.suit} ${c.rank} (${c.cardId}) active=${c.active} scene=${!!c.scene}`))

    // Check if any card is currently being played (animating to center)
    // Check ALL positions, not just bottom - cards stay on table until round ends
    const allPlayedCardIds = new Set<string>()
    this.playedCards.forEach((card) => {
      allPlayedCardIds.add(card.cardId)
    })
    console.log('  - Currently played cards:', Array.from(allPlayedCardIds))

    // Build the new hand by filtering and checking against store
    const newHandSprites: CardSprite[] = []

    currentHand.forEach((cardSprite) => {
      const stillInHand = hand.some((c) => c.id === cardSprite.cardId)
      const isBeingPlayed = allPlayedCardIds.has(cardSprite.cardId)

      if (stillInHand) {
        // Card is still in hand according to store - keep it
        console.log(`  - Keeping card in hand: ${cardSprite.suit} ${cardSprite.rank} (${cardSprite.cardId})`)
        newHandSprites.push(cardSprite)
      } else if (isBeingPlayed) {
        // Card is being played/animated - don't destroy it, but don't keep it in hand either
        console.log(`  - Card is on table (played), not destroying: ${cardSprite.suit} ${cardSprite.rank} (${cardSprite.cardId})`)
        // Card sprite stays alive on the table, but is removed from hand array
      } else {
        // Card is not in hand and not being played - destroy it
        console.log(`  - Destroying card: ${cardSprite.suit} ${cardSprite.rank} (${cardSprite.cardId})`)
        cardSprite.destroy()
      }
    })

    // Add new cards that exist in store but not in display
    hand.forEach((card, index) => {
      const alreadyExists = newHandSprites.some((c) => c.cardId === card.id)
      if (!alreadyExists) {
        console.log(`  - Adding new card: ${card.suit} ${card.rank} (${card.id})`)
        const cardSprite = this.dealCardToPlayer(
          'bottom',
          card.suit,
          card.rank,
          usePlayerStore.getState().playerId,
          card.id // Pass card ID for proper tracking
        )
        newHandSprites.splice(index, 0, cardSprite)
      }
    })

    // Update hand reference with the new synchronized hand
    this.playerHands.set('bottom', newHandSprites)

    console.log('  - Final hand size:', newHandSprites.length)

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
      // Only update cards that are fully initialized and added to the scene
      hand.forEach((card) => {
        // Check if card is fully initialized (has active scene and input system)
        if (card.scene && card.active && card.input) {
          card.setPlayable(false)
        }
      })
      return
    }

    // Get playable cards based on Spar rules
    const playableCards = getPlayableCards(playerHand, currentSuit as any)
    const playableIds = new Set(playableCards.map((c) => c.id))

    // Update card sprites - only update cards that are fully initialized
    hand.forEach((cardSprite) => {
      // Check if card is fully initialized (has active scene and input system)
      // This prevents calling setPlayable on cards that are still being added to the scene
      if (cardSprite.scene && cardSprite.active && cardSprite.input) {
        const isPlayable = playableIds.has(cardSprite.cardId)
        cardSprite.setPlayable(isPlayable)
      }
    })
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupWebSocketListeners(): void {
    if (!socketService.isConnected()) {
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
    socketService.on('gameStarted', gameStartedHandler)
    this.socketHandlers.set('gameStarted', gameStartedHandler)

    // cardPlayed - A player played a card
    const cardPlayedHandler: ServerToClientEvents['cardPlayed'] = (data) => {
      const { playerId, card, currentTurn } = data

      console.log('[GameScene] cardPlayed event received:', data)

      // Update game state
      useGameStore.getState().playCard(playerId, card)

      // Update whose turn it is
      if (currentTurn) {
        const myPlayerId = usePlayerStore.getState().playerId
        const isMyTurn = currentTurn === myPlayerId
        usePlayerStore.getState().setIsMyTurn(isMyTurn)
        console.log('[GameScene] Turn updated - isMyTurn:', isMyTurn, 'currentTurn:', currentTurn)
      }

      // If it's the current player, the card is already visually played
      if (playerId === usePlayerStore.getState().playerId) {
        console.log('[GameScene] Current player card already displayed')
        console.log('[GameScene] About to remove card from hand:', card)
        console.log('[GameScene] Current hand before removal:', usePlayerStore.getState().hand)
        usePlayerStore.getState().removeCardFromHand(card.id)
        console.log('[GameScene] Hand after removal:', usePlayerStore.getState().hand)
        // Update playable cards after current player's card is removed
        this.updatePlayableCards(useGameStore.getState().currentSuit)
        return
      }

      // Animate opponent card play
      const position = this.getPlayerPositionById(playerId)
      if (position) {
        console.log(`[GameScene] Opponent at ${position} played ${card.suit} ${card.rank}`)

        // Create and animate opponent's card
        const opponentCard = this.dealCardToPlayer(
          position,
          card.suit,
          card.rank,
          playerId,
          card.id
        )

        // Immediately play the card (animate to center)
        setTimeout(() => {
          this.playCard(opponentCard, position)
        }, 100)
      } else {
        console.warn('[GameScene] Could not find position for player:', playerId)
      }

      // Update playable cards after any card is played
      this.updatePlayableCards(useGameStore.getState().currentSuit)

      console.log('[GameScene] Card played processing complete')
    }
    socketService.on('cardPlayed', cardPlayedHandler)
    this.socketHandlers.set('cardPlayed', cardPlayedHandler)

    // roundWon - Round finished, someone won
    const roundWonHandler: ServerToClientEvents['roundWon'] = (data) => {
      const { winnerId, isDry, isShowDry } = data
      const roundsWon = (data as any).roundsWon as Record<string, number> | undefined

      // Update scores from roundsWon map (sync with backend)
      if (roundsWon) {
        Object.entries(roundsWon).forEach(([playerId, rounds]) => {
          const player = useGameStore.getState().players.find(p => p.id === playerId)
          if (player) {
            // Set score directly to rounds won (not increment)
            const currentScore = player.score
            if (rounds !== currentScore) {
              useGameStore.getState().updateScore(playerId, rounds - currentScore)
            }
          }
        })
      }

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

      console.log('[GameScene] Round won:', { winnerId, roundsWon, isDry, isShowDry })
    }
    socketService.on('roundWon', roundWonHandler)
    this.socketHandlers.set('roundWon', roundWonHandler)

    // gameEnded - Game finished
    const gameEndedHandler: ServerToClientEvents['gameEnded'] = (data) => {
      const { winnerId, finalScores } = data
      // Extract winnerName and winnerScore from the event data
      const winnerName = (data as any).winnerName || 'Unknown'
      const winnerScore = (data as any).winnerScore || finalScores?.[winnerId] || 0

      // Set the game winner info
      useGameStore.getState().setGameWinner({
        id: winnerId,
        name: winnerName,
        score: winnerScore,
      })

      // Set game phase to finished
      useGameStore.getState().setGamePhase('finished')

      console.log('[GameScene] Game ended:', { winnerId, winnerName, winnerScore, finalScores })
    }
    socketService.on('gameEnded', gameEndedHandler)
    this.socketHandlers.set('gameEnded', gameEndedHandler)

    // turnChanged - Turn switched to another player
    const turnChangedHandler: ServerToClientEvents['turnChanged'] = (data) => {
      const { currentPlayerId, timeRemaining } = data

      // Update whose turn it is
      const isMyTurn = currentPlayerId === usePlayerStore.getState().playerId
      usePlayerStore.getState().setIsMyTurn(isMyTurn)

      // Update timer
      useGameStore.getState().setTimeRemaining(timeRemaining)

      // Update card playability based on new turn state
      this.updatePlayableCards(useGameStore.getState().currentSuit)

      console.log('[GameScene] Turn changed:', { currentPlayerId, isMyTurn, timeRemaining })
    }
    socketService.on('turnChanged', turnChangedHandler)
    this.socketHandlers.set('turnChanged', turnChangedHandler)

    // timerUpdate - Timer countdown
    const timerUpdateHandler: ServerToClientEvents['timerUpdate'] = (data) => {
      useGameStore.getState().setTimeRemaining(data.timeRemaining)
    }
    socketService.on('timerUpdate', timerUpdateHandler)
    this.socketHandlers.set('timerUpdate', timerUpdateHandler)

    // game:restarted - Game restarted by host
    const gameRestartedHandler: ServerToClientEvents['game:restarted'] = (data) => {
      console.log('[GameScene] Game restarted:', data)
      console.log('[GameScene] Full restart data:', JSON.stringify(data, null, 2))

      // 1. Clear all played cards from the table
      this.clearPlayedCards()

      // 2. Clear selected card if any
      if (this.selectedCard) {
        this.selectedCard.setSelected(false)
        this.selectedCard = null
      }

      // 3. Clear all player hands (destroy sprites and reset maps)
      this.playerHands.forEach((hand, position) => {
        hand.forEach((card) => card.destroy())
      })
      // Reset the playerHands map completely
      this.playerHands.clear()
      this.playerHands.set('bottom', [])
      this.playerHands.set('left', [])
      this.playerHands.set('top', [])
      this.playerHands.set('right', [])

      // 4. Reset player score rows (destroy old UI)
      this.playerScoreRows.forEach((row) => {
        row.container.destroy()
      })
      this.playerScoreRows.clear()

      // Destroy and recreate the scoreboard container
      if (this.scoreboardContainer) {
        this.scoreboardContainer.destroy()
        this.scoreboardContainer = null
      }

      // 5. Initialize game store from new backend state
      if (data.gameState) {
        console.log('[GameScene] Initializing game store with backend state...')
        useGameStore.getState().initializeFromBackend(data.gameState)

        // 6. Reset the position mapping - CRITICAL
        console.log('[GameScene] Rebuilding position map...')
        const gameState = useGameStore.getState()
        const playerState = usePlayerStore.getState()
        const currentPlayerId = playerState.playerId

        // Rebuild position map with fresh player data
        this.positionMap = mapPlayersToPositions(gameState.players, currentPlayerId)
        console.log('[GameScene] Position map rebuilt:', Array.from(this.positionMap.entries()))

        // 7. Initialize playerStore hand with current player's cards - CRITICAL
        const currentPlayer = gameState.players.find((p) => p.id === currentPlayerId)
        if (currentPlayer && currentPlayer.hand) {
          console.log('[GameScene] Initializing playerStore hand with', currentPlayer.hand.length, 'cards')
          console.log('[GameScene] Hand cards:', currentPlayer.hand.map((c: any) => `${c.suit} ${c.rank} (${c.id})`))
          usePlayerStore.getState().setHand(currentPlayer.hand)
          console.log('[GameScene] playerStore hand initialized successfully')
        } else {
          console.error('[GameScene] ERROR: Could not find current player or hand!', {
            currentPlayer,
            currentPlayerId,
            availablePlayers: gameState.players.map((p: any) => p.id),
          })
        }

        // 8. Set initial turn state
        if (data.gameState.currentTurn) {
          const isMyTurn = data.gameState.currentTurn === currentPlayerId
          usePlayerStore.getState().setIsMyTurn(isMyTurn)
          console.log('[GameScene] Initial turn state set - isMyTurn:', isMyTurn, 'currentTurn:', data.gameState.currentTurn)
        }
      } else {
        console.warn('[GameScene] No gameState provided in game:restarted event')
      }

      // 9. Reset game phase states
      useGameStore.getState().setGamePhase('playing')
      useGameStore.getState().setRoundPhase('playing')
      useGameStore.getState().setGameWinner(null)

      // 10. Reset playerStore game state (but keep hand which was set above)
      const currentHand = usePlayerStore.getState().hand
      usePlayerStore.getState().resetGameState()
      usePlayerStore.getState().setHand(currentHand)

      // 11. Recreate the scoreboard UI
      this.createPlayerInfoDisplays()

      // 12. Deal the new cards with animation
      this.dealCardsFromBackendState()

      // 13. Update player info displays
      this.updatePlayerInfoDisplays()

      console.log('[GameScene] Game restart complete - state fully reset and new cards dealt')
    }
    socketService.on('game:restarted', gameRestartedHandler)
    this.socketHandlers.set('game:restarted', gameRestartedHandler)
  }

  /**
   * Cleanup WebSocket event listeners
   */
  private cleanupWebSocketListeners(): void {
    this.socketHandlers.forEach((handler, event) => {
      socketService.off(event, handler)
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
