import { PlayingCard } from './PlayingCard';
import { HostIcon } from './icons_master';

interface PeekingPhaseDisplayProps {
  players: any[];
  currentPlayerId?: string;
  peekedCards: Record<string, number[]>;
  readyPlayers: string[];
  onPeekCard: (cardIndex: number) => void;
}

export function PeekingPhaseDisplay({
  players,
  currentPlayerId,
  peekedCards,
  readyPlayers,
  onPeekCard
}: PeekingPhaseDisplayProps) {
  const currentPlayerPeekedCards = peekedCards[currentPlayerId || ''] || [];
  const canPeekMore = currentPlayerPeekedCards.length < 2;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Peek at Your Cards!</h1>
        </div>

        {/* Player Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {players.map((player) => {
            const isCurrentPlayer = currentPlayerId === player.id;
            const playerPeekedCards = peekedCards[player.id] || [];
            
            return (
              <div key={player.id} className={`border rounded-lg p-4 ${isCurrentPlayer ? 'border-blue-400 bg-blue-50' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {player.isHost && <HostIcon />}
                    <h3 className="font-semibold text-lg">
                      {player.name}
                    </h3>
                  </div>
                  {/* Ready Status Indicator */}
                  {readyPlayers.includes(player.id) && (
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <span className="mr-1">✓</span>
                      Ready
                    </div>
                  )}
                </div>
                
                {/* Cards Grid - 2x2 grid for 4 cards */}
                <div className="grid grid-cols-2 grid-rows-2 gap-2 max-w-[140px] mx-auto">
                  {player.cards.map((card: any, cardIndex: number) => {
                    const isPeeked = playerPeekedCards.includes(cardIndex);
                    const isMyCard = isCurrentPlayer;
                    const canClick = isMyCard && canPeekMore && !isPeeked;
                    
                    return (
                      <div key={cardIndex} className="relative">
                        <PlayingCard
                          card={card}
                          isHidden={!isPeeked}
                          onClick={canClick ? () => onPeekCard(cardIndex) : undefined}
                          className={canClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
                        />
                        {isPeeked && (
                          <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 rounded-full">
                            ✓
                          </div>
                        )}
                        {canClick && (
                          <div className="absolute -top-1 -left-1 bg-blue-500 text-white text-xs px-1 rounded-full">
                            Click
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {isCurrentPlayer && (
                  <div className="text-center mt-2">
                    <p className="text-sm text-gray-600">
                      {canPeekMore 
                        ? `Click ${2 - currentPlayerPeekedCards.length} more card${2 - currentPlayerPeekedCards.length === 1 ? '' : 's'} to peek`
                        : 'You\'ve peeked at all 2 cards!'
                      }
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Click on any 2 of your 4 cards to peek at them</li>
            <li>• Memorize your cards - they will be hidden after peeking</li>
            <li>• Click "Ready" in the Game Actions panel when you're done peeking</li>
            <li>• Game starts when all players are ready</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
