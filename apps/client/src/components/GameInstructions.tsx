import React from 'react';

export const GameInstructions: React.FC = () => {
  return (
    <div className="text-xs text-gray-600 leading-tight">
      <div className="mb-2">
        <strong>🎯 Objective:</strong> Keep your total points as low as possible by the end of each round.
        Think of it like golf – but with cards. ⛳
      </div>
      
      <div className="mb-2">
        <strong>📝 Setup:</strong> Each player starts with 4 cards face down. Flip 2 cards face up to begin – 
        this is the only time you can peek. Follow the in-game prompts for guidance.
      </div>
      
      <div className="mb-2">
        <strong>🔄 On Your Turn:</strong> You can draw a card – from the deck (face down) or the discard pile (face up), 
        then swap it with one of your 4 cards (face up or face down).
      </div>
      
      <div className="mb-2">
        <strong>🎲 Trick Cards:</strong> 8 (Spy) → Peek at one of your face-down cards. 7 (Swap) → Swap one of your cards with another player's card.
      </div>
      
      <div className="mb-2">
        <strong>🃏 Special Twist – PABLO!</strong> If you think you have the lowest score, call "Pablo!" at the start of your turn. 
        Everyone else gets one final turn, then the round ends.
      </div>
      
      <div className="mb-2">
        <strong>⚠️ If you're wrong:</strong> your score = your total + the highest other player's score.
        <br />
        <strong>✅ If you're right:</strong> your score for that round = -10 points (a huge win).
      </div>
      
      <div className="mb-2">
        <strong>🔢 Scoring:</strong> Number cards → face value (e.g., 2 = 2 points, 9 = 9 points). 
        Face cards (J, Q, K) → 10 points. Ace → 1 point. Joker → -5 points (the golden card!).
      </div>
      
      <div className="mb-2">
        <strong>🏆 Game End:</strong> Rounds continue until a player reaches the cutoff score (default = 100). 
        The player with the lowest total at the end wins the game.
      </div>
      
      <div className="mb-2">
        <strong>📱 Quick Tips:</strong> Watch what others draw/discard – it reveals their strategy. 👀 
        Don't call Pablo too early unless you're sure. 😏 Timing matters just as much as luck.
      </div>
      
      <p>
        <strong>👉 That's it!</strong> Draw, swap, call Pablo, and remember: sometimes the riskiest move is the smartest one.
      </p>
    </div>
  );
};
