import type { Suit, Rank } from '../../store/types'

/**
 * Spar Deck Constants
 * 35 cards total: Hearts (9), Clubs (9), Diamonds (9), Spades (8)
 * Spades runs 6-K (no Ace of spades) per the corrected Spar deck
 */

export const ALL_SUITS: readonly Suit[] = ['hearts', 'clubs', 'diamonds', 'spades'] as const

export const ALL_RANKS: readonly Rank[] = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const

// Spades has 8 cards: 6-K (no Ace of spades)
export const SPADES_RANKS: readonly Rank[] = ['6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const

/**
 * Generate the texture key for a card.
 *
 * Card faces are drawn in-engine (ticket 18, see `cardTextureFactory.ts`) - the
 * key still identifies the texture, but it is now a generated canvas texture
 * rather than a loaded PNG.
 * @param suit - The card suit
 * @param rank - The card rank
 * @returns Texture key in format: "card_hearts_6"
 */
export function getCardAssetKey(suit: Suit, rank: Rank): string {
  return `card_${suit}_${rank.toLowerCase()}`
}

/**
 * Check if a card is valid in the Spar deck
 * @param suit - The card suit
 * @param rank - The card rank
 * @returns true if the card exists in Spar deck
 */
export function isValidSparCard(suit: Suit, rank: Rank): boolean {
  // Spades runs 6-K: there is no Ace of spades
  if (suit === 'spades' && rank === 'A') {
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
 * Generate complete Spar deck (35 cards)
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
export const SPAR_DECK_SIZE = 35

/**
 * Card back texture key (drawn in-engine, see `cardTextureFactory.ts`)
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
