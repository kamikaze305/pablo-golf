import { Card, Suit, Rank, GameSettings } from './types.js';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createCard(suit: Suit, rank: Rank, settings: GameSettings): Card {
  const isJoker = rank === 'JOKER';
  
  let value: number;
  if (isJoker) {
    value = -5;
  } else if (rank === 'A') {
    value = 1;
  } else if (['J', 'Q', 'K'].includes(rank)) {
    value = settings.faceCardValues[rank as 'J' | 'Q' | 'K'];
  } else {
    value = parseInt(rank);
  }

  return {
    suit,
    rank,
    value,
    isJoker
  };
}

export function createDeck(settings: GameSettings): Card[] {
  const deck: Card[] = [];

  // Add regular cards
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(createCard(suit, rank, settings));
    }
  }

  // Add jokers if enabled
  if (settings.jokersEnabled) {
    deck.push(createCard('hearts', 'JOKER', settings));
    deck.push(createCard('hearts', 'JOKER', settings));
  }

  return deck;
}

export function getCardDisplayName(card: Card): string {
  if (card.isJoker) {
    return 'Joker';
  }
  return `${card.rank}${card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}`;
}

export function getCardValue(card: Card): number {
  return card.value;
}



