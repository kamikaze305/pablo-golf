import { GameState, PowerCardEffect, Player, Card } from './types.js';

export const POWER_CARD_EFFECTS: Record<string, PowerCardEffect> = {
  '7': {
    type: '7',
    description: 'Swap one of your cards with any opponent\'s card (Trick Card)',
    execute: (gameState: GameState, playerId: string, payload: { playerIndex: number; cardIndex: number; myCardIndex: number }): GameState => {
      const { playerIndex, cardIndex, myCardIndex } = payload;
      const currentPlayer = gameState.players.find(p => p.id === playerId);
      const targetPlayer = gameState.players[playerIndex];
      
      if (!currentPlayer || !targetPlayer || playerIndex >= gameState.players.length) {
        return gameState;
      }

      const newPlayers = [...gameState.players];
      const newCurrentPlayer = { ...currentPlayer };
      const newTargetPlayer = { ...targetPlayer };

      // Swap cards
      const temp = newCurrentPlayer.cards[myCardIndex];
      newCurrentPlayer.cards[myCardIndex] = newTargetPlayer.cards[cardIndex];
      newTargetPlayer.cards[cardIndex] = temp;

      newPlayers[gameState.players.indexOf(currentPlayer)] = newCurrentPlayer;
      newPlayers[playerIndex] = newTargetPlayer;

      return {
        ...gameState,
        players: newPlayers,
        lastAction: { type: 'power', playerId, powerType: '7', payload }
      };
    }
  },

  '8': {
    type: '8',
    description: 'Spy peek any single card (yours or opponent\'s) (Trick Card)',
    execute: (gameState: GameState, playerId: string, payload: { playerIndex: number; cardIndex: number }): GameState => {
      // This is a read-only action, so we just record it
      return {
        ...gameState,
        lastAction: { type: 'power', playerId, powerType: '8', payload }
      };
    }
  },

  '9': {
    type: '9',
    description: 'Optional power card effect',
    execute: (gameState: GameState, playerId: string, payload?: any): GameState => {
      return {
        ...gameState,
        lastAction: { type: 'power', playerId, powerType: '9', payload }
      };
    }
  },

  '10': {
    type: '10',
    description: 'Optional power card effect',
    execute: (gameState: GameState, playerId: string, payload?: any): GameState => {
      return {
        ...gameState,
        lastAction: { type: 'power', playerId, powerType: '10', payload }
      };
    }
  },

  'J': {
    type: 'J',
    description: 'Optional power card effect',
    execute: (gameState: GameState, playerId: string, payload?: any): GameState => {
      return {
        ...gameState,
        lastAction: { type: 'power', playerId, powerType: 'J', payload }
      };
    }
  },

  'Q': {
    type: 'Q',
    description: 'Optional power card effect',
    execute: (gameState: GameState, playerId: string, payload?: any): GameState => {
      return {
        ...gameState,
        lastAction: { type: 'power', playerId, powerType: 'Q', payload }
      };
    }
  }
};

export function executePowerCard(gameState: GameState, playerId: string, powerType: '7' | '8' | '9' | '10' | 'J' | 'Q', payload?: any): GameState {
  const effect = POWER_CARD_EFFECTS[powerType];
  if (!effect) {
    return gameState;
  }
  return effect.execute(gameState, playerId, payload);
}

// Trick card functions
export function activateTrickCard(gameState: GameState, playerId: string, trickType: '7' | '8', card: Card): GameState {
  return {
    ...gameState,
    activeTrick: {
      type: trickType,
      playerId,
      card,
      activated: false
    }
  };
}

export function executeTrickCard(gameState: GameState, playerId: string, trickType: '7' | '8', payload: any): GameState {
  if (trickType === '7') {
    // Swap trick
    const { myCardIndex, targetPlayerIndex, targetCardIndex } = payload;
    const currentPlayer = gameState.players.find(p => p.id === playerId);
    const targetPlayer = gameState.players[targetPlayerIndex];
    
    if (!currentPlayer || !targetPlayer) {
      return gameState;
    }

    const newPlayers = [...gameState.players];
    const newCurrentPlayer = { ...currentPlayer };
    const newTargetPlayer = { ...targetPlayer };

    // Swap cards
    const temp = newCurrentPlayer.cards[myCardIndex];
    newCurrentPlayer.cards[myCardIndex] = newTargetPlayer.cards[targetCardIndex];
    newTargetPlayer.cards[targetCardIndex] = temp;

    newPlayers[gameState.players.indexOf(currentPlayer)] = newCurrentPlayer;
    newPlayers[targetPlayerIndex] = newTargetPlayer;

    return {
      ...gameState,
      players: newPlayers,
      activeTrick: undefined,
      lastAction: { type: 'executeTrick', playerId, trickType, payload }
    };
  } else if (trickType === '8') {
    // Spy trick - just record the action
    return {
      ...gameState,
      activeTrick: undefined,
      lastAction: { type: 'executeTrick', playerId, trickType, payload }
    };
  }

  return gameState;
}

