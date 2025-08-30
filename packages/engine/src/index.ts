// Core types
export type { Suit, Rank, Card, Player, GameSettings, RoomSettings, GameState, GameAction, GameResult, RNG, TrickCardState, SwapAction, SpyAction } from './types';
// Game engine
export { PabloGameEngine } from './gameEngine.js';
// Card utilities
export * from './cards.js';
// RNG utilities
export * from './rng.js';
// Configuration
export * from './config.js';

// Trick card utilities
export * from './trickCards.js';

// Import config for default settings
import { GAME_CONFIG } from './config.js';

// Default settings
export const DEFAULT_GAME_SETTINGS = {
    jokersEnabled: true,
    faceCardValues: {
        J: 10,
        Q: 10,
        K: 10
    },
    matchingRule: true,
    targetScore: GAME_CONFIG.DEFAULT_TARGET_SCORE,
    revealOnDisconnect: false,
    maxPlayers: GAME_CONFIG.MAX_PLAYERS,
    scoreboardCarryover: true,
    autosaveRoundState: true,
    specialTricksEnabled: true,
    // New configurable settings
    cardsPerPlayer: GAME_CONFIG.CARDS_PER_PLAYER,
    cardsGridColumns: GAME_CONFIG.CARDS_GRID_COLUMNS,
    cardsGridRows: GAME_CONFIG.CARDS_GRID_ROWS
};
