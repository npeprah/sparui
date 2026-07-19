import type { Card, Suit } from '../../store/types'

/**
 * Determines if the player must follow suit based on Spar rules
 *
 * Spar Rule: You must play the same suit as the leader if you have it.
 * If you don't have the suit, you can play any card.
 *
 * @param hand - Player's current hand
 * @param ledSuit - The suit led by the round leader (null if player is leader)
 * @returns true if player has cards of the led suit and must follow
 */
export function mustFollowSuit(hand: Card[], ledSuit: Suit | null): boolean {
  if (!ledSuit) {
    return false // No suit to follow (player is leader)
  }

  return hand.some(card => card.suit === ledSuit)
}

/**
 * Gets the list of cards the player can legally play
 *
 * Spar Rule: Must play the led suit if you have it, otherwise any card is playable.
 *
 * @param hand - Player's current hand
 * @param ledSuit - The suit led by the round leader (null if player is leader)
 * @returns Array of playable cards
 */
export function getPlayableCards(hand: Card[], ledSuit: Suit | null): Card[] {
  // If no led suit, all cards are playable (player is leader)
  if (!ledSuit) {
    return [...hand]
  }

  // Get cards matching the led suit
  const matchingSuitCards = hand.filter(card => card.suit === ledSuit)

  // If player has cards of led suit, only those are playable
  if (matchingSuitCards.length > 0) {
    return matchingSuitCards
  }

  // Otherwise, all cards are playable (player is out of led suit)
  return [...hand]
}
