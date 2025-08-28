// Core types
export type { Suit, Rank, Card, Player, GameSettings, RoomSettings, GameState, GameAction, GameResult, RNG } from './types';
// Game engine
export { PabloGameEngine } from './gameEngine.js';
// Card utilities
export * from './cards.js';
// RNG utilities
export * from './rng.js';

// Default settings
export const DEFAULT_GAME_SETTINGS = {
    jokersEnabled: true,
    faceCardValues: {
        J: 10,
        Q: 10,
        K: 10
    },

    matchingRule: true,
    targetScore: 100,
    revealOnDisconnect: false,
    maxPlayers: 5,
    scoreboardCarryover: true,
    autosaveRoundState: true
};
