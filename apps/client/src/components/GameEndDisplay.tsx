import { PlayingCard } from './PlayingCard';
import { HostIcon } from './icons_master';

interface GameEndDisplayProps {
  players: any[];
  pabloCalled: boolean;
  pabloCallerId?: string;
  isHost: boolean;
  onResetGame: () => void;
  roundNumber: number;
  cutoffScore: number;
}

// Helper function to format card display names with proper suit symbols
const formatCardDisplay = (card: any): string => {
  if (!card) return 'Empty';
  if (card.isJoker) return `JOKER (${card.value})`;
  
  const suitSymbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  
  const suitSymbol = suitSymbols[card.suit as keyof typeof suitSymbols] || card.suit;
  return `${card.rank} ${suitSymbol} (${card.value})`;
};

export function GameEndDisplay({
  players,
  pabloCalled,
  pabloCallerId,
  onResetGame,
  isHost,
  roundNumber,
  cutoffScore
}: GameEndDisplayProps) {
  // Sort players by total score (lowest first for winner)
  const sortedPlayers = [...players].sort((a, b) => a.totalScore - b.totalScore);
  const winner = sortedPlayers[0];

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-lg p-6 relative overflow-hidden">
        {/* Firecracker Animation */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-4 animate-bounce">
            <span className="text-2xl">🎆</span>
          </div>
          <div className="absolute top-8 right-8 animate-bounce" style={{ animationDelay: '0.5s' }}>
            <span className="text-2xl">✨</span>
          </div>
          <div className="absolute bottom-8 left-8 animate-bounce" style={{ animationDelay: '1s' }}>
            <span className="text-2xl">🎇</span>
          </div>
          <div className="absolute bottom-4 right-4 animate-bounce" style={{ animationDelay: '1.5s' }}>
            <span className="text-2xl">🎊</span>
          </div>
        </div>
        
        <div className="text-center mb-6 relative z-10">
          <h1 className="text-4xl font-bold text-yellow-800 mb-2 animate-pulse">
            🏆 Game Complete! 🏆
          </h1>
          <div className="text-xl text-yellow-700 mb-4">
            <span className="font-bold text-2xl">🎉 {winner.name} Wins! 🎉</span>
          </div>
          <p className="text-lg text-yellow-600">
            Final Score: <span className="font-bold">{winner.totalScore}</span> points
          </p>
          <p className="text-lg text-yellow-600">
            Room Cutoff: <span className="font-bold">{cutoffScore}</span> points
          </p>
          
          {/* Round End Statement */}
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
            <h2 className="text-lg font-bold text-yellow-800 mb-2">
              🎯 Round {roundNumber} Complete!
            </h2>
            {pabloCalled && pabloCallerId && (() => {
              const pabloCaller = players.find(p => p.id === pabloCallerId);
              const isWinner = pabloCaller?.id === winner.id;
              const callerScore = pabloCaller?.totalScore || 0;
              
              if (isWinner) {
                return (
                  <p className="text-yellow-700">
                    ✅ Nailed it! <span className="font-bold">{pabloCaller?.name}</span> called Pablo and crushed it. {callerScore} points of pure glory!
                  </p>
                );
              } else {
                return (
                  <p className="text-yellow-700">
                    📢 <span className="font-bold">{pabloCaller?.name}</span> called Pablo but finished with {callerScore} points.
                  </p>
                );
              }
            })()}
            {!pabloCalled && (
              <p className="text-yellow-700">
                🎲 No one called Pablo this round. The game ended naturally!
              </p>
            )}
          </div>
        </div>

        {/* Final Rankings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {sortedPlayers.map((player, index) => (
            <div key={player.id} className={`border rounded-lg p-4 relative ${
              index === 0 ? 'bg-yellow-100 border-yellow-400 shadow-lg' : 'bg-white'
            }`}>
              {/* Rank Badge */}
              <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                index === 0 ? 'bg-yellow-500' : 
                index === 1 ? 'bg-gray-400' : 
                index === 2 ? 'bg-orange-600' : 'bg-gray-500'
              }`}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {player.isHost && <HostIcon />}
                  <h3 className="font-semibold text-lg">
                    {player.name}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Final Score</div>
                  <div className={`text-lg font-bold ${
                    index === 0 ? 'text-yellow-600' : 'text-gray-700'
                  }`}>
                    {player.totalScore}
                  </div>
                </div>
              </div>
              
              {/* Show all cards */}
              <div className="grid grid-cols-2 grid-rows-2 gap-2 max-w-[140px] mx-auto mb-3">
                {player.cards.map((card: any, cardIndex: number) => (
                  <PlayingCard
                    key={cardIndex}
                    card={card}
                  />
                ))}
              </div>
              
              {/* Score Calculation */}
              <div className="text-xs text-gray-500">
                <div className="font-medium mb-1">Final Cards:</div>
                <div className="space-y-1">
                  {player.cards
                    .map((card: any, cardIndex: number) => ({ card, cardIndex }))
                    .filter(({ card }: { card: any; cardIndex: number }) => card !== null)
                    .map(({ card, cardIndex }: { card: any; cardIndex: number }) => (
                      <div key={cardIndex} className="flex justify-between">
                        <span>Card {cardIndex + 1}:</span>
                        <span className="font-mono">
                          {formatCardDisplay(card)}
                        </span>
                      </div>
                    ))}
                </div>
                
                {/* Card Total */}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="font-medium text-center">
                    Card Total: {player.cards.reduce((sum: number, card: any) => sum + (card ? card.value : 0), 0)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pablo Caller Info */}
        {pabloCalled && pabloCallerId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-yellow-800 mb-2">
              Game Over for all other players. <span className="font-bold">{winner.name}</span> won with {winner.totalScore} points.
            </h3>
          </div>
        )}

        {/* Play Again Button - Only for Host */}
        {isHost && (
          <div className="text-center">
            <button
              onClick={onResetGame}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 font-semibold text-lg"
            >
              🎮 Play Again!
            </button>
          </div>
        )}
        
        {/* Non-host message */}
        {!isHost && (
          <div className="text-center">
            <p className="text-gray-600 text-lg">
              Waiting for the host to start a new game...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
