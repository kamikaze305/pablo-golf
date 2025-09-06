import { HelpCircle } from 'lucide-react';
import { PlayingCard } from './PlayingCard';
import { useState } from 'react';
import { HostIcon } from './icons_master';

interface PeekingPhaseCompactProps {
  players: any[];
  currentPlayerId?: string;
  peekedCards: Record<string, number[]>;
  readyPlayers: string[];
  gameSettings?: {
    cardsPerPlayer: number;
    cardsGridColumns: number;
    cardsGridRows: number;
  };
  onPeekCard: (cardIndex: number) => void;
}

export function PeekingPhaseCompact({
  players,
  currentPlayerId,
  peekedCards,
  readyPlayers,
  gameSettings,
  onPeekCard
}: PeekingPhaseCompactProps) {
  const [showHelp, setShowHelp] = useState(false);
  const currentPlayerPeekedCards = peekedCards[currentPlayerId || ''] || [];
  const canPeekMore = currentPlayerPeekedCards.length < (gameSettings?.cardsPerPlayer || 4) / 2;

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Peek at Your Cards!</h2>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Show instructions"
          >
            <HelpCircle size={20} />
          </button>
        </div>





        {/* Player Cards Grid - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {players.map((player) => {
            const isCurrentPlayer = currentPlayerId === player.id;
            const playerPeekedCards = peekedCards[player.id] || [];
            
            return (
              <div key={player.id} className={`border rounded-lg p-3 ${isCurrentPlayer ? 'border-blue-400 bg-blue-50' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {player.isHost && <HostIcon />}
                    <h3 className="font-semibold text-sm flex items-center">
                      {readyPlayers.includes(player.id) && (
                        <span className="text-green-500 mr-1" title="Player is Ready - Waiting for others...">✓</span>
                      )}
                      {player.name}
                    </h3>
                  </div>
                  {/* Reserve space for consistent layout */}
                  <div className="min-w-[20px] h-4"></div>
                </div>
                
                {/* Cards Grid - Configurable grid layout */}
                <div 
                  className="grid gap-1 max-w-[120px] mx-auto"
                  style={{
                    gridTemplateColumns: `repeat(${gameSettings?.cardsGridColumns || 2}, 1fr)`,
                    gridTemplateRows: `repeat(${gameSettings?.cardsGridRows || 2}, 1fr)`
                  }}
                >
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
                      </div>
                    );
                  })}
                </div>
                
                {isCurrentPlayer && (
                  <div className="text-center mt-2">
                    <p className="text-xs text-gray-600">
                      {canPeekMore 
                        ? `${2 - currentPlayerPeekedCards.length} more card${2 - currentPlayerPeekedCards.length === 1 ? '' : 's'} to peek`
                        : 'You\'ve peeked at all 2 cards!'
                      }
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>


      </div>
    </div>
  );
}
