export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'hidden';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'JOKER';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
  isJoker: boolean;
  // Store original card info when hidden
  originalSuit?: Suit;
  originalRank?: Rank;
}

export interface Player {
  id: string;
  name: string;
  cards: (Card | null)[];
  isConnected: boolean;
  totalScore: number;
  roundScore: number;
  isHost: boolean;
  shortId?: string;
}

// New types for special trick cards
export interface TrickCardState {
  isActive: boolean;
  type: 'swap' | 'spy' | null;
  playerId: string;
  cardRank: Rank;
  instructions: string;
  targetPlayerId?: string;
  targetCardIndex?: number;
  sourceCardIndex?: number;
}

export interface SwapAction {
  sourcePlayerId: string;
  sourceCardIndex: number;
  targetPlayerId: string;
  targetCardIndex: number;
}

export interface SpyAction {
  targetPlayerId: string;
  targetCardIndex: number;
}

export interface GameSettings {
  jokersEnabled: boolean;
  faceCardValues: {
    J: number;
    Q: number;
    K: number;
  };
  matchingRule: boolean;
  targetScore: number;
  revealOnDisconnect: boolean;
  maxPlayers: number;
  scoreboardCarryover: boolean;
  autosaveRoundState: boolean;
  // New setting for special trick cards
  specialTricksEnabled: boolean;
}

export interface RoomSettings extends GameSettings {
  roomKey: string;
  joinPassword?: string;
}

export interface RoundHistory {
  roundNumber: number;
  playerScores: { [playerId: string]: number };
  roundDeltas: { [playerId: string]: number };
  pabloCallerId?: string;
  pabloBonus?: { playerId: string; bonus: number };
}

export interface GameState {
  roomId: string;
  settings: RoomSettings;
  players: Player[];
  currentPlayerIndex: number;
  stock: Card[];
  discard: Card[];
  gamePhase: 'waiting' | 'peeking' | 'playing' | 'scored' | 'finished' | 'roundEnd' | 'trickActive';
  roundNumber: number;
  shuffleSeed: number;
  lastAction?: GameAction;
  pabloCalled: boolean;
  pabloCallerId?: string;
  finalRoundStarted: boolean;
  finalRoundPlayerIndex: number;
  playersWhoHadFinalTurn: string[];
  roundEndTimer?: number;
  roundHistory: RoundHistory[];
  peekedCards?: { [playerId: string]: number[] };
  readyPlayers?: string[]; // Track which players have clicked ready
  // New trick card state
  activeTrick?: TrickCardState;
}

export type GameAction = 
  | { type: 'draw'; source: 'stock' | 'discard'; playerId: string; card?: Card }
  | { type: 'replace'; playerId: string; cardIndex: number; card?: Card }
  | { type: 'discard'; playerId: string }
  | { type: 'callPablo'; playerId: string }
  | { type: 'pabloWindow'; playerId: string }
  | { type: 'peekCard'; playerId: string; cardIndex: number }
  | { type: 'playerReady'; playerId: string }
  | { type: 'startRound' }
  | { type: 'endRound' }
  | { type: 'endGame'; playerId: string }
  | { type: 'resetGame' }
  // New trick card actions
  | { type: 'activateTrick'; playerId: string; cardRank: Rank }
  | { type: 'executeSwap'; playerId: string; swapAction: SwapAction }
  | { type: 'executeSpy'; playerId: string; spyAction: SpyAction }
  | { type: 'skipTrick'; playerId: string }

export interface GameResult {
  playerScores: { [playerId: string]: number };
  roundDeltas: { [playerId: string]: number };
  winner?: string;
  pabloBonus?: { playerId: string; bonus: number };
}

export interface RNG {
  seed: number;
  next(): number;
  nextInt(min: number, max: number): number;
  shuffle<T>(array: T[]): T[];
}
