// Game Configuration Constants
export const GAME_CONFIG = {
  // Player Limits
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 6,
  
  // Card Configuration
  CARDS_PER_PLAYER: 4,
  CARDS_GRID_COLUMNS: 2,
  CARDS_GRID_ROWS: 2,
  
  // Room Limits
  MAX_ROOMS: 50,
  MAX_PLAYERS_PER_ROOM: 6,
  MAX_CONNECTIONS: 300,
  
  // Game Settings
  DEFAULT_TARGET_SCORE: 100,
  MIN_TARGET_SCORE: 50,
  MAX_TARGET_SCORE: 200,
  
  // Pablo Window Settings
  PABLO_WINDOW_DURATION: 15000, // 15 seconds in milliseconds
  
  // UI Settings
  CARD_WIDTH: 80,
  CARD_HEIGHT: 120,
  CARD_GAP: 4,
  
  // Animation Durations
  CARD_REPLACE_ANIMATION_DURATION: 300,
  CARD_SELECT_ANIMATION_DURATION: 150,
  
  // Validation Rules
  MIN_PLAYER_NAME_LENGTH: 1,
  MAX_PLAYER_NAME_LENGTH: 20,
  ROOM_KEY_LENGTH: 6,
  
  // Environment Variables
  ENV_VARS: {
    MAX_ROOMS: 'MAX_ROOMS',
    MAX_PLAYERS_PER_ROOM: 'MAX_PLAYERS_PER_ROOM',
    MAX_CONNECTIONS: 'MAX_CONNECTIONS',
    PORT: 'PORT',
    ORIGIN: 'ORIGIN',
    QA_ENABLED: 'QA_ENABLED',
    QA_USER: 'QA_USER',
    QA_PASS: 'QA_PASS',
    QA_IP_ALLOWLIST: 'QA_IP_ALLOWLIST'
  }
} as const;

// Type for the configuration
export type GameConfig = typeof GAME_CONFIG;

// Helper function to get environment variable with fallback
export function getEnvVar(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

// Helper function to get numeric environment variable with fallback
export function getEnvVarNumber(key: string, fallback: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : fallback;
}

// Helper function to get boolean environment variable with fallback
export function getEnvVarBoolean(key: string, fallback: boolean): boolean {
  const value = process.env[key];
  return value ? value.toLowerCase() === 'true' : fallback;
}
