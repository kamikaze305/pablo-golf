# Pablo Card Game Configuration

This document describes all the configurable settings for the Pablo Card Game.

## Configuration File

The main configuration is located in `packages/engine/src/config.ts` and contains all the game constants and limits.

## Core Game Settings

### Player Limits
- **MIN_PLAYERS**: 2 (minimum players to start a game)
- **MAX_PLAYERS**: 6 (maximum players allowed in a room)

### Card Configuration
- **CARDS_PER_PLAYER**: 4 (default number of cards each player receives)
- **CARDS_GRID_COLUMNS**: 2 (default grid columns for card layout)
- **CARDS_GRID_ROWS**: 2 (default grid rows for card layout)

### Room Limits
- **MAX_ROOMS**: 50 (maximum number of rooms the server can host)
- **MAX_PLAYERS_PER_ROOM**: 6 (maximum players per room)
- **MAX_CONNECTIONS**: 300 (maximum total connections to the server)

### Game Settings
- **DEFAULT_TARGET_SCORE**: 100 (default points to end the game)
- **MIN_TARGET_SCORE**: 50 (minimum allowed target score)
- **MAX_TARGET_SCORE**: 200 (maximum allowed target score)

### Pablo Window Settings
- **PABLO_WINDOW_DURATION**: 15000 (15 seconds in milliseconds for Pablo calling window)

### UI Settings
- **CARD_WIDTH**: 80 (card width in pixels)
- **CARD_HEIGHT**: 120 (card height in pixels)
- **CARD_GAP**: 4 (gap between cards in pixels)

### Animation Durations
- **CARD_REPLACE_ANIMATION_DURATION**: 300 (card replacement animation duration in ms)
- **CARD_SELECT_ANIMATION_DURATION**: 150 (card selection animation duration in ms)

### Validation Rules
- **MIN_PLAYER_NAME_LENGTH**: 1 (minimum player name length)
- **MAX_PLAYER_NAME_LENGTH**: 20 (maximum player name length)
- **ROOM_KEY_LENGTH**: 6 (length of room invitation keys)

## Environment Variables

The following environment variables can be set to override the default configuration:

```bash
# Server Configuration
MAX_ROOMS=50
MAX_PLAYERS_PER_ROOM=6
MAX_CONNECTIONS=300
PORT=4000
ORIGIN=http://localhost:5173

# QA Testing (Localhost Only)
QA_ENABLED=true
QA_USER=adminLocalOnly
QA_PASS=strong-password-here
QA_IP_ALLOWLIST=127.0.0.1,::1
```

## Room Creation Settings

When creating a room, hosts can configure:

1. **Target Score**: Points needed to win the game (50-200)
2. **Maximum Players**: Number of players allowed (2-6)
3. **Cards Per Player**: Number of cards each player receives (2-8)

## Dynamic Grid Layout

The card grid automatically adjusts based on the `cardsPerPlayer` setting:

- **4 cards**: 2x2 grid (default)
- **6 cards**: 3x2 grid
- **8 cards**: 4x2 grid
- **9 cards**: 3x3 grid

## Configuration Usage

### In Game Engine
```typescript
import { GAME_CONFIG } from '@pablo/engine';

// Use configuration constants
const maxPlayers = GAME_CONFIG.MAX_PLAYERS;
const cardsPerPlayer = GAME_CONFIG.CARDS_PER_PLAYER;
```

### In Server
```typescript
import { GAME_CONFIG } from '@pablo/engine';

// Use with environment variable fallback
const maxRooms = parseInt(process.env.MAX_ROOMS || GAME_CONFIG.MAX_ROOMS.toString());
```

### In Client Components
```typescript
import { GAME_CONFIG } from '@pablo/engine';

// Use for form validation
<input 
  type="number" 
  min={GAME_CONFIG.MIN_PLAYERS} 
  max={GAME_CONFIG.MAX_PLAYERS} 
/>
```

## Updating Configuration

To modify game settings:

1. Edit `packages/engine/src/config.ts`
2. Update the `GAME_CONFIG` object
3. Rebuild the engine package: `cd packages/engine && npm run build`
4. Rebuild dependent packages: `cd apps/server && npm run build`

## Best Practices

1. **Always use configuration constants** instead of hardcoded values
2. **Provide sensible defaults** for all configurable values
3. **Validate user input** against configuration limits
4. **Use environment variables** for deployment-specific settings
5. **Document changes** when modifying configuration values

## Migration Notes

When upgrading from previous versions:

- The default `maxPlayers` has been increased from 4 to 6
- Card grid layout is now configurable instead of hardcoded 2x2
- All hardcoded "4 cards" references have been replaced with configurable values
- Server limits now use configuration constants with environment variable fallbacks
