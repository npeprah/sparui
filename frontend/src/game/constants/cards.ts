import type { Suit, Rank } from '../../store/types'

/**
 * Spar Deck Constants
 * 34 cards total: Hearts (9), Clubs (9), Diamonds (9), Spades (7)
 * Spades has no 6 or A per traditional Spar rules
 */

export const ALL_SUITS: readonly Suit[] = ['hearts', 'clubs', 'diamonds', 'spades'] as const

export const ALL_RANKS: readonly Rank[] = [
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
] as const

// Spades only has 7 cards (no 6 or A)
export const SPADES_RANKS: readonly Rank[] = ['7', '8', '9', '10', 'J', 'Q', 'K'] as const

// Card asset path structure
export const CARD_ASSET_BASE_PATH = '/assets/cards'

/**
 * Generate the asset key for a card
 * @param suit - The card suit
 * @param rank - The card rank
 * @returns Asset key in format: "card_hearts_6"
 */
export function getCardAssetKey(suit: Suit, rank: Rank): string {
  return `card_${suit}_${rank.toLowerCase()}`
}

/**
 * Generate the file path for a card asset
 * @param suit - The card suit
 * @param rank - The card rank
 * @returns File path: "/assets/cards/hearts/hearts_6.png"
 */
export function getCardAssetPath(suit: Suit, rank: Rank): string {
  return `${CARD_ASSET_BASE_PATH}/${suit}/${suit}_${rank.toLowerCase()}.png`
}

/**
 * Check if a card is valid in the Spar deck
 * @param suit - The card suit
 * @param rank - The card rank
 * @returns true if the card exists in Spar deck
 */
export function isValidSparCard(suit: Suit, rank: Rank): boolean {
  // Spades cannot have 6 or A
  if (suit === 'spades' && (rank === '6' || rank === 'A')) {
    return false
  }
  return true
}

/**
 * Get all valid cards for a suit
 * @param suit - The card suit
 * @returns Array of valid ranks for the suit
 */
export function getValidRanksForSuit(suit: Suit): readonly Rank[] {
  if (suit === 'spades') {
    return SPADES_RANKS
  }
  return ALL_RANKS
}

/**
 * Generate complete Spar deck (34 cards)
 * @returns Array of all valid card combinations
 */
export function generateSparDeck(): Array<{ suit: Suit; rank: Rank }> {
  const deck: Array<{ suit: Suit; rank: Rank }> = []

  for (const suit of ALL_SUITS) {
    const validRanks = getValidRanksForSuit(suit)
    for (const rank of validRanks) {
      deck.push({ suit, rank })
    }
  }

  return deck
}

/**
 * Get the total number of cards in the Spar deck
 */
export const SPAR_DECK_SIZE = 34

/**
 * Card dimensions (original asset size)
 */
export const CARD_DIMENSIONS = {
  WIDTH: 512,
  HEIGHT: 768,
  ASPECT_RATIO: 512 / 768, // ~0.667
} as const

/**
 * Card back asset key
 */
export const CARD_BACK_KEY = 'card_back'

/**
 * Card display scales for different contexts
 */
export const CARD_SCALES = {
  HAND: 0.25, // Cards in player hand
  PLAYED: 0.2, // Cards in play area
  HOVER: 0.28, // Hover effect scale increase
  MOBILE_HAND: 0.18, // Smaller on mobile
  MOBILE_PLAYED: 0.15,
} as const
