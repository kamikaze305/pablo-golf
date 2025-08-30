# Pablo Card Game - Special Trick Cards 🎴

This document describes the special trick card mechanics in the Pablo card game.

## 🎯 Overview

Special trick cards (7 and 8) provide unique gameplay mechanics that can be activated when discarded during a player's turn.

## 🔄 Card 7 - Swap Trick

**Activation**: Discard a 7 during your turn

**Effect**: Choose one of your cards to swap with any card from another player's area. You can look at the incoming card before placing it.

**Rules**:
- **Eligibility**: Any player can use this trick
- **Target**: Any card in any player's area (including your own)
- **Visibility**: You can see the card you're swapping with before confirming
- **Timing**: Must be used immediately after discarding the 7

**UI Interaction**:
- Click on your card to select it as the source
- Click on target card to select it for swapping
- "Execute Swap" button to confirm the swap
- "Cancel" button to abort

**Examples**:

**Example 1 - Basic Swap**:
```
Player A discards 7♦ → Swap Trick activated
Player A selects their 2♠ as source
Player A selects Player B's K♥ as target
Result: Player A now has K♥, Player B has 2♠
```

**Example 2 - Self-Swap**:
```
Player A discards 7♣ → Swap Trick activated
Player A selects their 5♦ as source
Player A selects their own 8♠ as target
Result: Player A's cards are reordered: 8♠ and 5♦ swap positions
```

---

## 👁️ Card 8 - Spy Trick

**Activation**: Discard an 8 during your turn

**Effect**: Look at any card in your own or another player's area, then put it back immediately.

**Rules**:
- **Eligibility**: Any player can use this trick
- **Target**: Any card in any player's area
- **Visibility**: Only you can see the card
- **Duration**: Card is revealed briefly, then hidden again
- **Timing**: Must be used immediately after discarding the 8

**UI Interaction**:
- Click on any card to reveal it
- Card is shown briefly with a blue highlight
- Automatically hidden after a short delay

**Examples**:

**Example 1 - Spy Own Card**:
```
Player A discards 8♠ → Spy Trick activated
Player A clicks on their own 3♥
Result: Player A sees "3 of Hearts" (only visible to Player A)
Card remains in Player A's area
```

**Example 2 - Spy Opponent Card**:
```
Player A discards 8♦ → Spy Trick activated
Player A clicks on Player B's 2♠
Result: Player A sees "2 of Spades" (only visible to Player A)
Card remains in Player B's area
```

---

## 🎵 Audio Features

### Background Music
- **File Type**: MP3
- **Behavior**: Plays on loop during gameplay
- **Control**: On/Off toggle button
- **Auto-start**: Begins when game phase changes to 'playing'

### Sound Effects
- **Implementation**: Ready for future enhancement
- **Planned**: Card draw, discard, trick activation sounds

---

## 🎮 Game Flow with Tricks

### 1. Normal Turn
1. Player draws card (from stock or discard)
2. Player replaces card in hand (optional)
3. Player discards card
4. If discarded card is 7 or 8 → Trick activated

### 2. Trick Card Turn
1. Trick phase begins (`gamePhase: 'trickActive'`)
2. Player must execute trick or skip
3. After trick execution → Pablo window begins
4. Player calls Pablo or skips to end turn

---

## 🔧 Technical Implementation

### Engine Changes
- New `GameAction` types: `activateTrick`, `executeSwap`, `executeSpy`, `skipTrick`
- New `TrickCardState` interface to track active tricks
- New `SwapAction` and `SpyAction` interfaces for trick parameters

### Server Changes
- New socket event handlers for trick actions
- Trick validation and execution logic
- State synchronization during trick phases

### Client Changes
- Trick card UI components
- Card selection and highlighting
- Trick execution flow
- Result display and feedback

---

## 🎯 Strategy Tips

### When to Use Swap Trick (7)
- **Offensive**: Swap a low-value card for a high-value card
- **Defensive**: Move important cards to safer positions
- **Information**: Use to see what cards opponents have
- **Timing**: Best used when you have a good hand to protect

### When to Use Spy Trick (8)
- **Information Gathering**: See what cards opponents have
- **Planning**: Plan your strategy based on visible information
- **Bluffing**: Make opponents think you know their cards
- **Timing**: Use early in the game to gather information

---

## 🚀 Future Enhancements

### Planned Features
- **Trick Combinations**: Chain multiple tricks together
- **Special Effects**: Visual and audio effects for trick execution
- **Trick History**: Track which tricks were used in each game
- **Advanced Tricks**: More complex trick card mechanics

### Technical Improvements
- **Performance**: Optimize trick card rendering
- **Accessibility**: Better screen reader support for trick actions
- **Mobile**: Touch-optimized trick card interactions
- **Testing**: Comprehensive test coverage for trick mechanics
