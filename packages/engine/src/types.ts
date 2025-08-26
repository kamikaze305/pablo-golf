export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'hidden';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'JOKER';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
  isJoker: boolean;
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

export interface GameSettings {
  jokersEnabled: boolean;
  faceCardValues: {
    J: number;
    Q: number;
    K: number;
  };
  powerCards: {
    '7': boolean; // Swap
    '8': boolean; // Spy
    '9': boolean; // Optional
    '10': boolean; // Optional
    'J': boolean; // Optional
    'Q': boolean; // Optional
  };
  matchingRule: boolean;
  targetScore: number;
  revealOnDisconnect: boolean;
  maxPlayers: number;
  scoreboardCarryover: boolean;
  autosaveRoundState: boolean;
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
  gamePhase: 'waiting' | 'peeking' | 'playing' | 'scored' | 'finished' | 'roundEnd';
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
}

export type GameAction = 
  | { type: 'draw'; source: 'stock' | 'discard'; playerId: string; card?: Card }
  | { type: 'replace'; playerId: string; cardIndex: number; card?: Card }
  | { type: 'discard'; playerId: string }
  | { type: 'power'; playerId: string; powerType: '7' | '8' | '9' | '10' | 'J' | 'Q'; payload?: any }
  | { type: 'callPablo'; playerId: string }
  | { type: 'pabloWindow'; playerId: string }
  | { type: 'peekCard'; playerId: string; cardIndex: number }
  | { type: 'playerReady'; playerId: string }
  | { type: 'startRound' }
  | { type: 'endRound' }
  | { type: 'resetGame' };

export interface GameResult {
  playerScores: { [playerId: string]: number };
  roundDeltas: { [playerId: string]: number };
  winner?: string;
  pabloBonus?: { playerId: string; bonus: number };
}

export interface PowerCardEffect {
  type: '7' | '8' | '9' | '10' | 'J' | 'Q';
  description: string;
  execute: (gameState: GameState, playerId: string, payload?: any) => GameState;
}

export interface RNG {
  seed: number;
  next(): number;
  nextInt(min: number, max: number): number;
  shuffle<T>(array: T[]): T[];
}
