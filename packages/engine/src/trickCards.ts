import { Card, Rank, TrickCardState, SwapAction, SpyAction } from './types.js';

export function isTrickCard(rank: Rank): boolean {
  return rank === '7' || rank === '8';
}

export function getTrickCardType(rank: Rank): 'swap' | 'spy' | null {
  switch (rank) {
    case '7':
      return 'swap';
    case '8':
      return 'spy';
    default:
      return null;
  }
}

export function getTrickCardInstructions(rank: Rank): string {
  switch (rank) {
    case '7':
      return 'Swap Trick: Choose one of your cards to swap with any card from another player\'s area. You can look at the incoming card before placing it.';
    case '8':
      return 'Spy Trick: Look at any card in your own or another player\'s area, then put it back immediately.';
    default:
      return '';
  }
}

export function createTrickCardState(
  playerId: string, 
  cardRank: Rank
): TrickCardState {
  const type = getTrickCardType(cardRank);
  const instructions = getTrickCardInstructions(cardRank);
  
  return {
    isActive: true,
    type,
    playerId,
    cardRank,
    instructions
  };
}

export function validateSwapAction(
  swapAction: SwapAction,
  players: any[],
  currentPlayerId: string
): { isValid: boolean; error?: string } {
  // Validate source player
  const sourcePlayer = players.find(p => p.id === swapAction.sourcePlayerId);
  if (!sourcePlayer) {
    return { isValid: false, error: 'Source player not found' };
  }

  // Validate target player
  const targetPlayer = players.find(p => p.id === swapAction.targetPlayerId);
  if (!targetPlayer) {
    return { isValid: false, error: 'Target player not found' };
  }

  // Validate card indices
  if (swapAction.sourceCardIndex < 0 || swapAction.sourceCardIndex >= 6) {
    return { isValid: false, error: 'Invalid source card index' };
  }

  if (swapAction.targetCardIndex < 0 || swapAction.targetCardIndex >= 6) {
    return { isValid: false, error: 'Invalid target card index' };
  }

  // Validate that cards exist at those positions
  if (!sourcePlayer.cards[swapAction.sourceCardIndex]) {
    return { isValid: false, error: 'Source card position is empty' };
  }

  if (!targetPlayer.cards[swapAction.targetCardIndex]) {
    return { isValid: false, error: 'Target card position is empty' };
  }

  // Validate that the current player is the one performing the swap
  if (swapAction.sourcePlayerId !== currentPlayerId) {
    return { isValid: false, error: 'Can only swap from your own cards' };
  }

  return { isValid: true };
}

export function validateSpyAction(
  spyAction: SpyAction,
  players: any[]
): { isValid: boolean; error?: string } {
  // Validate target player
  const targetPlayer = players.find(p => p.id === spyAction.targetPlayerId);
  if (!targetPlayer) {
    return { isValid: false, error: 'Target player not found' };
  }

  // Validate card index
  if (spyAction.targetCardIndex < 0 || spyAction.targetCardIndex >= 6) {
    return { isValid: false, error: 'Invalid target card index' };
  }

  // Validate that card exists at that position
  if (!targetPlayer.cards[spyAction.targetCardIndex]) {
    return { isValid: false, error: 'Target card position is empty' };
  }

  return { isValid: true };
}

export function executeSwap(
  players: any[],
  swapAction: SwapAction
): any[] {
  const newPlayers = [...players];
  
  // Find source and target players
  const sourcePlayerIndex = newPlayers.findIndex(p => p.id === swapAction.sourcePlayerId);
  const targetPlayerIndex = newPlayers.findIndex(p => p.id === swapAction.targetPlayerId);
  
  if (sourcePlayerIndex === -1 || targetPlayerIndex === -1) {
    throw new Error('Player not found');
  }

  // Create new player objects
  const sourcePlayer = { ...newPlayers[sourcePlayerIndex] };
  const targetPlayer = { ...newPlayers[targetPlayerIndex] };
  
  // Get the cards to swap
  const sourceCard = sourcePlayer.cards[swapAction.sourceCardIndex];
  const targetCard = targetPlayer.cards[swapAction.targetCardIndex];
  
  // Perform the swap
  sourcePlayer.cards[swapAction.sourceCardIndex] = targetCard;
  targetPlayer.cards[swapAction.targetCardIndex] = sourceCard;
  
  // Update the players array
  newPlayers[sourcePlayerIndex] = sourcePlayer;
  newPlayers[targetPlayerIndex] = targetPlayer;
  
  return newPlayers;
}

export function getSpyTargetCard(
  players: any[],
  spyAction: SpyAction
): Card | null {
  const targetPlayer = players.find(p => p.id === spyAction.targetPlayerId);
  if (!targetPlayer) {
    return null;
  }
  
  return targetPlayer.cards[spyAction.targetCardIndex] || null;
}
