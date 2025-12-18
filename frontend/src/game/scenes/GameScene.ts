import Phaser from 'phaser'
import { CardSprite } from '../sprites/CardSprite'
import type { Suit, Rank } from '../../store/types'
import { CARD_SCALES, CARD_DIMENSIONS } from '../constants/cards'
import {
  createDealAnimation,
  createPlayAnimation,
  calculateDealStagger,
} from '../utils/animations'
import { emitSoundEvent, triggerHaptic } from '../constants/animations'

/**
 * Player position around the table
 */
type PlayerPosition = 'bottom' | 'left' | 'top' | 'right'

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
  // Player hands (bottom = current player)
  private playerHands: Map<PlayerPosition, CardSprite[]> = new Map()

  // Cards in play area (center of table)
  private playedCards: Map<PlayerPosition, CardSprite> = new Map()

  // Layout configuration
  private layout: LayoutConfig = {
    cardScale: CARD_SCALES.HAND,
    handSpacing: 20,
    playAreaSize: 300,
  }

  // Selected card
  private selectedCard: CardSprite | null = null

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this.setupLayout()
    this.createBackground()
    this.createPlayArea()
    this.setupResponsive()

    // Initialize empty hands
    this.playerHands.set('bottom', [])
    this.playerHands.set('left', [])
    this.playerHands.set('top', [])
    this.playerHands.set('right', [])

    // Test: Deal 5 cards to bottom player (for MVP testing)
    this.dealTestHand()
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
    owner: string
  ): CardSprite {
    // Create card at deck position (top center)
    const deckX = this.cameras.main.width / 2
    const deckY = 100

    const card = new CardSprite(this, deckX, deckY, suit, rank, owner)
    card.setScale(this.layout.cardScale)
    card.setFaceDown(true)

    // Add to hand
    const hand = this.playerHands.get(position) || []
    hand.push(card)
    this.playerHands.set(position, hand)

    // Animate to hand position
    this.animateCardToHand(card, position, hand.length - 1)

    // Setup card click handler
    card.onCardClick = (clickedCard) => this.onCardClicked(clickedCard)

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
      })
    })
  }

  /**
   * Handle card click
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
  }

  /**
   * Get current player hand (bottom position)
   */
  public getCurrentPlayerHand(): CardSprite[] {
    return this.playerHands.get('bottom') || []
  }
}
