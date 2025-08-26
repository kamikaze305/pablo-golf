import { GameState, GameAction, GameResult, Player, RoomSettings, Card, RoundHistory } from './types.js';
import { createDeck, getCardValue, isPowerCard } from './cards.js';
import { createRNG } from './rng.js';
import { executePowerCard } from './powerCards.js';

export class PabloGameEngine {
  private state: GameState;

  constructor(roomId: string, settings: RoomSettings, players: Player[]) {
    // Generate shorter player IDs: <Room_Key + Player_No>
    const roomKey = settings.roomKey; // Use the room key instead of room ID
    const playersWithShortIds = players.map((p, index) => ({
      ...p,
      // Keep original player name, only set shortId
      shortId: `${roomKey}#${index + 1}`,
      cards: [null, null, null, null],
      roundScore: 0
    }));

    this.state = {
      roomId,
      settings,
      players: playersWithShortIds,
      currentPlayerIndex: 0,
      stock: [],
      discard: [],
      gamePhase: 'waiting',
      roundNumber: 0,
      shuffleSeed: Math.floor(Math.random() * 0x100000000),
      pabloCalled: false,
      finalRoundStarted: false,
      finalRoundPlayerIndex: 0,
      playersWhoHadFinalTurn: [],
      roundHistory: []
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  addPlayer(player: Player): void {
    // Only add player if they don't already exist
    if (!this.state.players.find(p => p.id === player.id)) {
      const roomKey = this.state.settings.roomKey;
      const playerNumber = this.state.players.length + 1;
      this.state.players.push({
        ...player,
        // Keep original player name, only set shortId
        shortId: `${roomKey}#${playerNumber}`,
        cards: [null, null, null, null],
        roundScore: 0
      });
    }
  }

  removePlayer(playerId: string): void {
    this.state.players = this.state.players.filter(p => p.id !== playerId);
  }

  getStateForPlayer(playerId: string): GameState {
    const state = this.getState();
    const player = state.players.find(p => p.id === playerId);
    
    if (!player) return state;

    // Check if current player is disconnected and skip if needed
    if (state.gamePhase === 'playing' && state.currentPlayerIndex !== undefined) {
      const currentPlayer = state.players[state.currentPlayerIndex];
      if (!currentPlayer.isConnected) {
        // Skip to next connected player
        const totalPlayers = state.players.length;
        let nextIndex = (state.currentPlayerIndex + 1) % totalPlayers;
        
        while (nextIndex !== state.currentPlayerIndex) {
          if (state.players[nextIndex].isConnected) {
            state.currentPlayerIndex = nextIndex;
            state.lastAction = undefined; // Clear any pending actions
            break;
          }
          nextIndex = (nextIndex + 1) % totalPlayers;
        }
      }
    }

    // Show all cards when round ends or game is finished
    if (state.gamePhase === 'roundEnd' || state.gamePhase === 'finished' || state.gamePhase === 'scored') {
      return state; // Return full state with all cards visible
    }

    // Handle peeking phase - show only peeked cards for the current player
    if (state.gamePhase === 'peeking') {
      state.players = state.players.map(p => {
        if (p.id === playerId) {
          // For current player, show only peeked cards
          const playerPeekedCards = state.peekedCards?.[playerId] || [];
          return {
            ...p,
            cards: p.cards.map((card, index) => {
              if (!card) return null;
              if (playerPeekedCards.includes(index)) {
                return card; // Show peeked cards
              } else {
                return { ...card, suit: 'hidden', rank: 'hidden' as any }; // Hide unpeeked cards
              }
            })
          };
        } else {
          // For other players, hide all cards
          return {
            ...p,
            cards: p.cards.map(card => card ? { ...card, suit: 'hidden', rank: 'hidden' as any } : null)
          };
        }
      });
      return state;
    }

    // Hide other players' cards during normal gameplay, but show cards for disconnected players
    state.players = state.players.map(p => {
      if (p.id === playerId) {
        // For current player, hide all cards (they must memorize)
        return {
          ...p,
          cards: p.cards.map(card => card ? { ...card, suit: 'hidden', rank: 'hidden' as any } : null)
        };
      }
      // Show cards for disconnected players
      if (!p.isConnected) return p;
      return {
        ...p,
        cards: p.cards.map(card => card ? { ...card, suit: 'hidden', rank: 'hidden' as any } : null)
      };
    });

    return state;
  }

  startRound(): GameState {
    if (this.state.gamePhase !== 'waiting') {
      throw new Error('Cannot start round: game is not in waiting phase');
    }

    // Generate new shuffle seed for each round to ensure different shuffles
    const newShuffleSeed = Math.floor(Math.random() * 0x100000000);
    const rng = createRNG(newShuffleSeed);
    const deck = createDeck(this.state.settings);
    const shuffledDeck = rng.shuffle(deck);

    // Deal 4 cards to each player (2x2 grid)
    const newPlayers = this.state.players.map(player => ({
      ...player,
      cards: shuffledDeck.splice(0, 4)
    }));

    this.state = {
      ...this.state,
      players: newPlayers,
      stock: shuffledDeck,
      discard: [], // Start with empty discard pile
      gamePhase: 'peeking', // Start with peeking phase
      roundNumber: this.state.roundNumber + 1,
      shuffleSeed: newShuffleSeed, // Update shuffle seed for next round
      currentPlayerIndex: 0,
      pabloCalled: false,
      pabloCallerId: undefined,
      finalRoundStarted: false,
      finalRoundPlayerIndex: 0,
      playersWhoHadFinalTurn: [],
      peekedCards: {}, // Track which cards each player has peeked at
      readyPlayers: [] // Track which players have clicked ready
    };

    return this.getState();
  }

  executeAction(action: GameAction): GameState {
    switch (action.type) {
      case 'draw':
        return this.handleDraw(action);
      case 'replace':
        return this.handleReplace(action);
      case 'discard':
        return this.handleDiscard(action);
      case 'power':
        return this.handlePower(action);
      case 'callPablo':
        return this.handleCallPablo(action);
      case 'pabloWindow':
        return this.handlePabloWindow(action);
      case 'peekCard':
        return this.handlePeekCard(action);
      case 'playerReady':
        return this.handlePlayerReady(action);
      case 'startRound':
        return this.startRound();
      case 'endRound':
        return this.endRound();
      case 'resetGame':
        return this.resetGame();
      default:
        throw new Error(`Unknown action type: ${(action as any).type}`);
    }
  }

  private handleDraw(action: Extract<GameAction, { type: 'draw' }>): GameState {
    if (this.state.gamePhase !== 'playing') {
      throw new Error('Cannot draw: game is not in playing phase');
    }

    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    if (currentPlayer.id !== action.playerId) {
      throw new Error('Not your turn');
    }

    let drawnCard: Card;
    if (action.source === 'stock') {
      if (this.state.stock.length === 0) {
        throw new Error('Stock is empty');
      }
      drawnCard = this.state.stock.pop()!;
    } else {
      if (this.state.discard.length === 0) {
        throw new Error('Discard pile is empty');
      }
      drawnCard = this.state.discard[this.state.discard.length - 1];
    }

    // Store drawn card for potential replacement
    this.state = {
      ...this.state,
      lastAction: {
        ...action,
        card: drawnCard
      }
    };

    return this.getState();
  }

  private handleReplace(action: Extract<GameAction, { type: 'replace' }>): GameState {
    if (this.state.gamePhase !== 'playing') {
      throw new Error('Cannot replace: game is not in playing phase');
    }

    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    if (currentPlayer.id !== action.playerId) {
      throw new Error('Not your turn');
    }

    if (action.cardIndex < 0 || action.cardIndex >= 4) {
      throw new Error('Invalid card index');
    }

    // Get the drawn card from last action
    const lastAction = this.state.lastAction;
    if (!lastAction || lastAction.type !== 'draw') {
      throw new Error('Must draw a card before replacing');
    }

    // Use the drawn card that was stored in lastAction
    const drawnCard = lastAction.card;
    if (!drawnCard) {
      throw new Error('No drawn card available');
    }

    // Replace the card
    const newPlayers = [...this.state.players];
    const newCurrentPlayer = { ...currentPlayer };
    const replacedCard = newCurrentPlayer.cards[action.cardIndex];
    
    newCurrentPlayer.cards[action.cardIndex] = drawnCard;
    newPlayers[this.state.currentPlayerIndex] = newCurrentPlayer;

    // Add replaced card to discard pile
    const newDiscard = [...this.state.discard];
    if (replacedCard) {
      newDiscard.push(replacedCard);
    }

    // Remove drawn card from source
    let newStock = [...this.state.stock];
    if (lastAction.source === 'stock') {
      newStock.pop();
    }

    // Check if this is final round - if so, end turn immediately
    if (this.state.finalRoundStarted) {
      // Add current player to final turn list
      const updatedFinalTurnPlayers = [...this.state.playersWhoHadFinalTurn];
      if (!updatedFinalTurnPlayers.includes(currentPlayer.id)) {
        updatedFinalTurnPlayers.push(currentPlayer.id);
      }

      // Move to next player
      const nextPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
      
      this.state = {
        ...this.state,
        players: newPlayers,
        stock: newStock,
        discard: newDiscard,
        currentPlayerIndex: nextPlayerIndex,
        lastAction: undefined, // Clear lastAction so next player can draw
        playersWhoHadFinalTurn: updatedFinalTurnPlayers
      };

      // Check if all players have had their final turn
      if (updatedFinalTurnPlayers.length >= this.state.players.length) {
        console.log('Engine: All players have had their final turn, ending round');
        return this.endRound();
      }
    } else {
      // Normal round - stay in Pablo window
      this.state = {
        ...this.state,
        players: newPlayers,
        stock: newStock,
        discard: newDiscard,
        lastAction: { type: 'pabloWindow', playerId: action.playerId } // Start Pablo window
      };
    }

    return this.getState();
  }

  private handleDiscard(action: Extract<GameAction, { type: 'discard' }>): GameState {
    if (this.state.gamePhase !== 'playing') {
      throw new Error('Cannot discard: game is not in playing phase');
    }

    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    if (currentPlayer.id !== action.playerId) {
      throw new Error('Not your turn');
    }

    // Check if player has drawn a card
    const lastAction = this.state.lastAction;
    if (!lastAction || lastAction.type !== 'draw') {
      throw new Error('Must draw a card before discarding');
    }

    // Get the drawn card
    const drawnCard = lastAction.card;
    if (!drawnCard) {
      throw new Error('No drawn card available');
    }

    // Remove drawn card from source if it was from discard
    let newStock = [...this.state.stock];
    let newDiscard = [...this.state.discard];
    if (lastAction.source === 'discard') {
      newDiscard.pop(); // Remove the card from discard pile
    }
    
    // Add drawn card to discard pile
    newDiscard.push(drawnCard);

    // Check if this is final round - if so, end turn immediately
    if (this.state.finalRoundStarted) {
      // Add current player to final turn list
      const updatedFinalTurnPlayers = [...this.state.playersWhoHadFinalTurn];
      if (!updatedFinalTurnPlayers.includes(currentPlayer.id)) {
        updatedFinalTurnPlayers.push(currentPlayer.id);
      }

      // Move to next player
      const nextPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
      
      this.state = {
        ...this.state,
        stock: newStock,
        discard: newDiscard,
        currentPlayerIndex: nextPlayerIndex,
        lastAction: undefined, // Clear lastAction so next player can draw
        playersWhoHadFinalTurn: updatedFinalTurnPlayers
      };

      // Check if all players have had their final turn
      if (updatedFinalTurnPlayers.length >= this.state.players.length) {
        console.log('Engine: All players have had their final turn, ending round');
        return this.endRound();
      }
    } else {
      // Normal round - stay in Pablo window
      this.state = {
        ...this.state,
        stock: newStock,
        discard: newDiscard,
        lastAction: { type: 'pabloWindow', playerId: action.playerId } // Start Pablo window
      };
    }

    return this.getState();
  }

  private handlePabloWindow(action: Extract<GameAction, { type: 'pabloWindow' }>): GameState {
    console.log('Engine: handlePabloWindow called with action:', action);
    console.log('Engine: Current state before pabloWindow:', {
      currentPlayerIndex: this.state.currentPlayerIndex,
      currentPlayerId: this.state.players[this.state.currentPlayerIndex]?.id,
      lastAction: this.state.lastAction,
      gamePhase: this.state.gamePhase,
      pabloCalled: this.state.pabloCalled,
      finalRoundStarted: this.state.finalRoundStarted,
      playersWhoHadFinalTurn: this.state.playersWhoHadFinalTurn
    });

    if (this.state.gamePhase !== 'playing') {
      throw new Error('Cannot start Pablo window: game is not in playing phase');
    }

    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    if (currentPlayer.id !== action.playerId) {
      console.log('Engine: Player mismatch - current player:', currentPlayer.id, 'action player:', action.playerId);
      throw new Error('Not your turn');
    }

    // Check if this is the final round and if all players have had their final turn
    if (this.state.finalRoundStarted) {
      // Add current player to the list of players who have had their final turn
      const updatedFinalTurnPlayers = [...this.state.playersWhoHadFinalTurn];
      if (!updatedFinalTurnPlayers.includes(currentPlayer.id)) {
        updatedFinalTurnPlayers.push(currentPlayer.id);
      }

      console.log('Engine: Final round - players who had final turn:', updatedFinalTurnPlayers);
      console.log('Engine: Total players:', this.state.players.length);

      // Check if all players have had their final turn
      if (updatedFinalTurnPlayers.length >= this.state.players.length) {
        console.log('Engine: All players have had their final turn, ending round');
        // End the round immediately
        return this.endRound();
      }
    }

    // Move to next player after Pablo window
    const nextPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
    console.log('Engine: Moving from player index', this.state.currentPlayerIndex, 'to', nextPlayerIndex);

    this.state = {
      ...this.state,
      currentPlayerIndex: nextPlayerIndex,
      lastAction: undefined, // Clear lastAction so next player can draw
      playersWhoHadFinalTurn: this.state.finalRoundStarted ? 
        [...this.state.playersWhoHadFinalTurn, currentPlayer.id] : 
        this.state.playersWhoHadFinalTurn
    };

    console.log('Engine: State after pabloWindow:', {
      currentPlayerIndex: this.state.currentPlayerIndex,
      lastAction: this.state.lastAction,
      playersWhoHadFinalTurn: this.state.playersWhoHadFinalTurn
    });

    return this.getState();
  }

  private handlePower(action: Extract<GameAction, { type: 'power' }>): GameState {
    if (this.state.gamePhase !== 'playing') {
      throw new Error('Cannot use power card: game is not in playing phase');
    }

    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    if (currentPlayer.id !== action.playerId) {
      throw new Error('Not your turn');
    }

    // Check if power card is enabled in settings
    if (!this.state.settings.powerCards[action.powerType]) {
      throw new Error(`Power card ${action.powerType} is not enabled`);
    }

    this.state = executePowerCard(this.state, action.playerId, action.powerType, action.payload);
    return this.getState();
  }

  private handlePeekCard(action: Extract<GameAction, { type: 'peekCard' }>): GameState {
    if (this.state.gamePhase !== 'peeking') {
      throw new Error('Cannot peek: game is not in peeking phase');
    }

    const player = this.state.players.find(p => p.id === action.playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    if (action.cardIndex < 0 || action.cardIndex >= 4) {
      throw new Error('Invalid card index');
    }

    // Initialize peekedCards for this player if not exists
    const currentPeekedCards = this.state.peekedCards || {};
    const playerPeekedCards = currentPeekedCards[action.playerId] || [];

    // Check if player has already peeked at 2 cards
    if (playerPeekedCards.length >= 2) {
      throw new Error('Already peeked at 2 cards');
    }

    // Check if player has already peeked at this specific card
    if (playerPeekedCards.includes(action.cardIndex)) {
      throw new Error('Already peeked at this card');
    }

    // Add card to peeked cards
    const updatedPeekedCards = {
      ...currentPeekedCards,
      [action.playerId]: [...playerPeekedCards, action.cardIndex]
    };

    this.state = {
      ...this.state,
      peekedCards: updatedPeekedCards
    };

    return this.getState();
  }

  private handleCallPablo(action: Extract<GameAction, { type: 'callPablo' }>): GameState {
    if (this.state.gamePhase !== 'playing') {
      throw new Error('Cannot call Pablo: game is not in playing phase');
    }

    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    if (currentPlayer.id !== action.playerId) {
      throw new Error('Not your turn');
    }

    // If Pablo hasn't been called yet, start the final round
    if (!this.state.pabloCalled) {
      console.log(`Engine: Pablo called by ${action.playerId}, starting final round`);
      
      // Move to next player immediately after Pablo is called
      const nextPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
      
      this.state = {
        ...this.state,
        pabloCalled: true,
        pabloCallerId: action.playerId,
        finalRoundStarted: true,
        finalRoundPlayerIndex: this.state.currentPlayerIndex,
        currentPlayerIndex: nextPlayerIndex, // Move to next player
        playersWhoHadFinalTurn: [action.playerId], // Current player has had their final turn
        lastAction: undefined // Clear lastAction so next player can draw
      };
    } else {
      // Pablo was already called, just record the action
      this.state = {
        ...this.state,
        lastAction: action
      };
    }

    return this.getState();
  }

  private endRound(): GameState {
    if (this.state.gamePhase !== 'playing') {
      throw new Error('Cannot end round: game is not in playing phase');
    }

    // Calculate scores
    const playerScores: { [playerId: string]: number } = {};
    const roundDeltas: { [playerId: string]: number } = {};
    let lowestScore = Infinity;
    let lowestPlayerId: string | undefined;

    this.state.players.forEach(player => {
      const score = player.cards.reduce((sum, card) => sum + (card ? getCardValue(card) : 0), 0);
      playerScores[player.id] = score;
      roundDeltas[player.id] = score;
      
      if (score < lowestScore) {
        lowestScore = score;
        lowestPlayerId = player.id;
      }
    });

    // Apply Pablo bonus/penalty
    let pabloBonus: { playerId: string; bonus: number } | undefined;
    if (this.state.pabloCalled && this.state.pabloCallerId) {
      const callerScore = playerScores[this.state.pabloCallerId];
      if (this.state.pabloCallerId === lowestPlayerId) {
        // Caller has lowest score: -10 bonus
        pabloBonus = { playerId: this.state.pabloCallerId, bonus: -10 };
        roundDeltas[this.state.pabloCallerId] -= 10;
      } else {
        // Caller doesn't have lowest: add penalty equal to highest score
        const highestScore = Math.max(...Object.values(playerScores));
        roundDeltas[this.state.pabloCallerId] += highestScore;
      }
    }

    // Update player total scores
    const newPlayers = this.state.players.map(player => ({
      ...player,
      totalScore: player.totalScore + roundDeltas[player.id],
      roundScore: roundDeltas[player.id]
    }));

    // Save round history
    const roundHistoryEntry: RoundHistory = {
      roundNumber: this.state.roundNumber,
      playerScores: playerScores,
      roundDeltas: roundDeltas,
      pabloCallerId: this.state.pabloCallerId,
      pabloBonus: pabloBonus
    };

    // Check for game end
    const gameWinner = newPlayers.find(p => p.totalScore >= this.state.settings.targetScore);
    const gamePhase = gameWinner ? 'finished' : 'roundEnd';

    this.state = {
      ...this.state,
      players: newPlayers,
      gamePhase,
      lastAction: { type: 'endRound' },
      roundEndTimer: 30, // 30 second timer for next round
      roundHistory: [...this.state.roundHistory, roundHistoryEntry]
    };

    // Set a timer to transition to waiting phase after countdown
    if (gamePhase === 'roundEnd') {
      setTimeout(() => {
        // Reset game state for next round
        const resetPlayers = this.state.players.map(player => ({
          ...player,
          cards: [null, null, null, null], // Clear cards
          roundScore: 0 // Reset round score
        }));
        
        this.state = {
          ...this.state,
          players: resetPlayers,
          gamePhase: 'waiting',
          roundEndTimer: undefined,
          currentPlayerIndex: 0, // Reset to first player
          stock: [], // Clear stock
          discard: [], // Clear discard
          lastAction: undefined, // Clear last action
          pabloCalled: false, // Reset Pablo state
          pabloCallerId: undefined,
          finalRoundStarted: false,
          finalRoundPlayerIndex: 0,
          playersWhoHadFinalTurn: [],
          peekedCards: undefined,
          readyPlayers: []
        };
      }, 30000); // 30 seconds
    }

    return this.getState();
  }

  resetGame(): GameState {
    // Reset all game state but keep players and room settings
    const resetPlayers = this.state.players.map(player => ({
      ...player,
      cards: [null, null, null, null], // Clear cards
      totalScore: 0, // Reset total score
      roundScore: 0 // Reset round score
    }));
    
    this.state = {
      ...this.state,
      players: resetPlayers,
      gamePhase: 'waiting',
      roundNumber: 0, // Reset round number
      shuffleSeed: Math.floor(Math.random() * 0x100000000), // New shuffle seed
      currentPlayerIndex: 0, // Reset to first player
      stock: [], // Clear stock
      discard: [], // Clear discard
      lastAction: undefined, // Clear last action
      pabloCalled: false, // Reset Pablo state
      pabloCallerId: undefined,
      finalRoundStarted: false,
      finalRoundPlayerIndex: 0,
      playersWhoHadFinalTurn: [],
      roundEndTimer: undefined,
      roundHistory: [], // Clear round history
      peekedCards: undefined,
      readyPlayers: []
    };

    return this.getState();
  }

  // Method to handle when a player clicks ready
  private handlePlayerReady(action: Extract<GameAction, { type: 'playerReady' }>): GameState {
    if (this.state.gamePhase !== 'peeking') {
      throw new Error('Cannot mark ready: game is not in peeking phase');
    }

    // Add player to ready list if not already there
    const readyPlayers = [...(this.state.readyPlayers || [])];
    if (!readyPlayers.includes(action.playerId)) {
      readyPlayers.push(action.playerId);
    }

    this.state = {
      ...this.state,
      readyPlayers
    };

    // Check if all players are ready
    const allPlayersReady = readyPlayers.length >= this.state.players.length;
    if (allPlayersReady) {
      // Transition to playing phase
      this.state = {
        ...this.state,
        gamePhase: 'playing',
        readyPlayers: [] // Clear ready players for next round
      };
    }

    return this.getState();
  }

  // Helper method to find the next connected player
  private findNextConnectedPlayer(startIndex: number): number {
    const totalPlayers = this.state.players.length;
    let nextIndex = (startIndex + 1) % totalPlayers;
    
    // Look for the next connected player
    while (nextIndex !== startIndex) {
      if (this.state.players[nextIndex].isConnected) {
        return nextIndex;
      }
      nextIndex = (nextIndex + 1) % totalPlayers;
    }
    
    // If we've gone through all players and none are connected, return the original index
    return startIndex;
  }

  // Helper method to check if current player is disconnected and skip if needed
  private skipDisconnectedPlayer(): boolean {
    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    if (!currentPlayer.isConnected) {
      console.log(`Engine: Skipping disconnected player ${currentPlayer.name} (${currentPlayer.id})`);
      const nextPlayerIndex = this.findNextConnectedPlayer(this.state.currentPlayerIndex);
      this.state = {
        ...this.state,
        currentPlayerIndex: nextPlayerIndex,
        lastAction: undefined // Clear any pending actions
      };
      return true; // Indicates that we skipped a player
    }
    return false; // No skipping needed
  }

  getGameResult(): GameResult {
    const playerScores: { [playerId: string]: number } = {};
    const roundDeltas: { [playerId: string]: number } = {};
    let winner: string | undefined;

    this.state.players.forEach(player => {
      playerScores[player.id] = player.totalScore;
      roundDeltas[player.id] = player.roundScore;
      
      if (player.totalScore >= this.state.settings.targetScore) {
        winner = player.id;
      }
    });

    return {
      playerScores,
      roundDeltas,
      winner
    };
  }
}

