# Pablo Card Game

A real-time multiplayer card game built with React, TypeScript, Socket.IO, and Node.js.

## Game Rules

### Objective
Players aim to have the lowest score at the end of each round. The game ends when a player reaches the target score (default: 100 points).

### Setup
- Each player receives 4 cards in a 2×2 grid
- Players can peek at their bottom 2 cards initially
- After initial setup, bottom cards are hidden until revealed by power cards
- One card is placed face-up on the discard pile
- Remaining cards form the stock pile

### Gameplay

#### Turn Structure
1. **Draw Phase**: Player draws one card from either:
   - Stock pile (face-down)
   - Discard pile (face-up)
2. **Action Phase**: Player must either:
   - **Replace**: Swap the drawn card with one of their 4 cards
   - **Discard**: Discard the drawn card without replacing
3. **Pablo Window**: After action, player has 15 seconds to call "Pablo"
4. **Turn End**: Turn passes to next player

#### Pablo Calling
- **When to Call**: Any player can call "Pablo" during their turn or the 15-second window after their action
- **Effect**: Once Pablo is called, this becomes the **final round**
- **Final Round Rules**:
  - Turn continues to next player as usual
  - Every player gets exactly **one final turn**
  - After all players have taken their final turn, the round ends
  - Scoring is calculated and round concludes
  - Host can start a new round

#### Scoring
- **Card Values**:
  - Number cards (2-10): Face value
  - Face cards (J, Q, K): 10 points (configurable)
  - Aces: 1 point
  - Jokers: -5 points (if enabled)
- **Pablo Bonus/Penalty**:
  - If Pablo caller has the lowest score: **-10 points bonus**
  - If Pablo caller doesn't have the lowest score: **Add penalty equal to highest score**
- **Winner**: Player with the lowest total score

### Power Cards (Optional)
- **7 - Swap**: Exchange cards with another player
- **8 - Spy**: Reveal hidden cards of any player
- **9, 10, J, Q**: Additional power variants (configurable)

### Room Settings

#### Deck & Values
- **Jokers**: On/Off (default: On; Jokers = -5 points)
- **Face Card Values**: J/Q/K = 10 (default), or custom values

#### Powers
- **7 = Swap**: On/Off (default: On)
- **8 = Spy**: On/Off (default: On)
- **Optional**: 9, 10, J, Q power variants (default: Off)

#### Table Rules
- **Matching Rule**: Replace multiple known matches with one drawn card (default: On)
- **Target Score**: Points to end game (default: 100)
- **Reveal on Disconnect**: Show cards when player disconnects (default: Off)
- **Max Players**: 2-5 (default: 5)

#### Persistence
- **Scoreboard Carryover**: Keep scores between rounds (default: On)
- **Autosave Round State**: Save game state automatically (default: On)

## Technical Implementation

### Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **State Management**: Zustand
- **Backend**: Node.js + Express + Socket.IO
- **Game Engine**: Pure TypeScript state machine with seeded RNG

### Key Features
- **Real-time Multiplayer**: Socket.IO rooms with automatic reconnection
- **Session Persistence**: Players stay logged in after browser refresh
- **Server-Authoritative**: All game logic validated server-side
- **Responsive Design**: Works on desktop and mobile
- **PWA Support**: Offline capabilities for local play

### Security & Fair Play
- **Hidden Cards**: Only stored server-side, clients get placeholders
- **Private Peeks**: Per-player secrets, never broadcast
- **Server Validation**: All moves validated server-side
- **Deterministic Shuffling**: Seeded Fisher-Yates shuffle per round

## Deployment

### Host-Only Setup (Single Laptop)
1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build All Packages**:
   ```bash
   npm run build
   ```

3. **Start Server**:
   ```bash
   cd apps/server
   $env:PORT=4002; node dist/index.js
   ```

4. **Access Game**:
   - Open browser to `http://localhost:4002`
   - Create or join rooms using the Room Key

### Environment Variables
Create a `.env` file in the server directory:
```env
PORT=4002
ORIGIN=http://localhost:4002
QA_ENABLED=true
QA_USER=adminLocalOnly
QA_PASS=strong-password-here
QA_IP_ALLOWLIST=127.0.0.1,::1
DEFAULT_JOKERS=on
DEFAULT_MATCHING_RULE=on
MAX_ROOMS=50
MAX_PLAYERS_PER_ROOM=5
MAX_CONNECTIONS=300
```

## Development

### Project Structure
```
pablo/
├── apps/
│   ├── client/          # React frontend
│   └── server/          # Node.js backend
├── packages/
│   └── engine/          # Game logic engine
└── README.md
```

### Build Commands
```bash
# Build engine package
cd packages/engine && npm run build

# Build server
cd apps/server && npm run build

# Build client
cd apps/client && npm run build
```

### Testing
```bash
# Run engine tests
cd packages/engine && npm test

# Run client tests
cd apps/client && npm test
```

## Game Flow

### Room Creation
1. Host creates room with custom settings
2. Room Key is generated and displayed
3. Other players join using Room Key

### Game Session
1. Players join room
2. Host starts the round
3. Players take turns drawing and replacing/discarding cards
4. Pablo can be called at any time to end the round
5. After final round, scoring is calculated
6. Host can start a new round

### Session Persistence
- Player sessions are saved to localStorage
- Automatic reconnection on browser refresh
- Seamless game continuation

## Future Enhancements
- [ ] Offline mode with local AI opponents
- [ ] Pass-and-play mode on single device
- [ ] Enhanced power cards (9, 10, J, Q variants)
- [ ] Tournament mode
- [ ] Mobile app
- [ ] Cloud deployment for online play

## Contributing
This is a host-only deployment designed for local multiplayer games. The game engine is pure TypeScript and can be easily extended with new features.

## License
MIT License - see LICENSE file for details.
