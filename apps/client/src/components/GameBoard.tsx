import { Trophy } from 'lucide-react';
import { PlayingCard } from './PlayingCard';
import { RoundEndDisplay } from './RoundEndDisplay';
import { HostIcon } from './icons_master';

interface GameBoardProps {
  stock: any[];
  discard: any[];
  players: any[];
  currentPlayerIndex: number;
  currentPlayerId?: string;
  selectedCardIndex: number | null;
  canReplace: boolean;
  lastReplacedCard: {playerId: string, cardIndex: number} | null;
  isTrickActive: boolean;
  isMyTrick: boolean;
  activeTrick: any;
  swapSourceCardIndex: number | null;
  swapTargetPlayerId: string;
  swapTargetCardIndex: number | null;
  spyTargetPlayerId: string;
  spyTargetCardIndex: number | null;
  gamePhase: string;
  peekedCards: Record<string, number[]>;
  readyPlayers: string[];
  gameSettings?: {
    cardsPerPlayer: number;
    cardsGridColumns: number;
    cardsGridRows: number;
  };
  roundNumber?: number;
  pabloCalled?: boolean;
  pabloCallerId?: string;
  isHost?: boolean;
  onCardClick: (playerId: string, cardIndex: number) => void;
  onPeekCard: (cardIndex: number) => void;
}

export function GameBoard({
  stock,
  discard,
  players,
  currentPlayerIndex,
  currentPlayerId,
  selectedCardIndex,
  canReplace,
  lastReplacedCard,
  isTrickActive,
  isMyTrick,
  activeTrick,
  swapSourceCardIndex,
  swapTargetPlayerId,
  swapTargetCardIndex,
  spyTargetPlayerId,
  spyTargetCardIndex,
  gamePhase,
  peekedCards,
  readyPlayers,
  gameSettings,
  roundNumber,
  pabloCalled,
  pabloCallerId,
  isHost,
  onCardClick,
  onPeekCard
}: GameBoardProps) {
  // If in peeking phase, show integrated game board with peeking functionality
  if (gamePhase === 'peeking') {
    return (
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-3">Game Board</h2>
          
          {/* Stock and Discard - Compact */}
          <div className="flex justify-center space-x-6 mb-4">
            <div className="text-center">
              <div className="flex justify-center mb-1">
                {stock.length > 0 ? (
                  <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-1">
                    <PlayingCard 
                      card={{suit: 'hidden', rank: 'hidden', value: 0, isJoker: false}}
                      isHidden={true}
                      className="w-10 h-14"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-16 bg-blue-100 border-2 border-blue-300 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xs">Empty</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600">Stock ({stock.length})</p>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-1">
                {discard.length > 0 ? (
                  <div className="bg-green-100 border-2 border-green-300 rounded-lg p-1">
                    <PlayingCard 
                      card={discard[discard.length - 1]}
                      isHidden={false}
                      className="w-10 h-14"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-16 bg-green-100 border-2 border-green-300 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold text-xs">Empty</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600">Discard ({discard.length})</p>
            </div>
          </div>

          {/* Player Cards Grid with Peeking Functionality */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {players.map((player) => {
              const isCurrentTurn = currentPlayerIndex === players.findIndex(p => p.id === player.id);
              const isCurrentPlayer = currentPlayerId === player.id;
              const playerPeekedCards = peekedCards[player.id] || [];
              const isReady = readyPlayers.includes(player.id);
              const canPeekMore = isCurrentPlayer && playerPeekedCards.length < (gameSettings?.cardsPerPlayer || 4) / 2;
              
              return (
                <div key={player.id} className={`border rounded-lg p-3 ${isCurrentTurn ? 'border-yellow-400 bg-yellow-50 shadow-lg' : 'bg-blue-50 border-blue-200'} ${isCurrentPlayer ? 'border-blue-400 bg-blue-100 shadow-lg' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {player.isHost && <HostIcon />}
                      <h3 className={`font-semibold text-sm ${isCurrentTurn ? 'text-yellow-800' : 'text-blue-800'} ${isCurrentPlayer ? 'text-blue-900' : ''} ${!player.isConnected ? 'text-gray-500' : ''}`}>
                        {player.name}
                        {isReady && (
                          <span 
                            className="text-green-500 ml-1 cursor-help" 
                            title="Player is Ready - Waiting for others..."
                            data-tooltip="Player is Ready - Waiting for others..."
                          >
                            ✓
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Trophy size={12} className="text-yellow-500" />
                      <span className="font-semibold text-sm">{player.totalScore}</span>
                    </div>
                  </div>
                  
                  {/* Cards Grid - Configurable grid layout */}
                  <div 
                    className={`grid gap-1 max-w-[140px] mx-auto mb-2`}
                    style={{
                      gridTemplateColumns: `repeat(${gameSettings?.cardsGridColumns || 2}, 1fr)`,
                      gridTemplateRows: `repeat(${gameSettings?.cardsGridRows || 2}, 1fr)`
                    }}
                  >
                    {player.cards.map((card: any, cardIndex: number) => {
                      const isPeeked = playerPeekedCards.includes(cardIndex);
                      const canClick = isCurrentPlayer && canPeekMore && !isPeeked;
                      
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
                  
                  {/* Peeking Status */}
                  <div className="text-center text-xs text-gray-600">
                    {isCurrentPlayer ? (
                      <div className="mb-1">
                        {canPeekMore 
                          ? `${2 - playerPeekedCards.length} more card${2 - playerPeekedCards.length === 1 ? '' : 's'} to peek`
                          : 'You\'ve peeked at all 2 cards!'
                        }
                      </div>
                    ) : (
                      <div className="mb-1">
                        Peeked: {playerPeekedCards.length}/2 cards
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // If round has ended, show round end display within the game board layout
  if (gamePhase === 'roundEnd') {
    return (
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-3">Game Board</h2>
          
          {/* Round End Display integrated into Game Board */}
          <RoundEndDisplay
            roundNumber={roundNumber || 1}
            players={players}
            pabloCalled={pabloCalled || false}
            pabloCallerId={pabloCallerId}
            isHost={isHost || false}
          />
        </div>
      </div>
    );
  }

  // Regular game board display
  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-3">Game Board</h2>
        
        {/* Stock and Discard - Compact */}
        <div className="flex justify-center space-x-6 mb-4">
          <div className="text-center">
            <div className="flex justify-center mb-1">
              {stock.length > 0 ? (
                <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-1">
                  <PlayingCard 
                    card={{suit: 'hidden', rank: 'hidden', value: 0, isJoker: false}}
                    isHidden={true}
                    className="w-10 h-14"
                  />
                </div>
              ) : (
                <div className="w-12 h-16 bg-blue-100 border-2 border-blue-300 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xs">Empty</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600">Stock ({stock.length})</p>
          </div>
          
          <div className="text-center">
            <div className="flex justify-center mb-1">
              {discard.length > 0 ? (
                <div className="bg-green-100 border-2 border-green-300 rounded-lg p-1">
                  <PlayingCard 
                    card={discard[discard.length - 1]}
                    isHidden={false}
                    className="w-10 h-14"
                  />
                </div>
              ) : (
                <div className="w-12 h-16 bg-green-100 border-2 border-green-300 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold text-xs">Empty</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600">Discard ({discard.length})</p>
          </div>
        </div>

        {/* Player Cards Grid - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {players.map((player) => {
            const isCurrentTurn = currentPlayerIndex === players.findIndex(p => p.id === player.id);
            
            return (
              <div key={player.id} className={`border rounded-lg p-3 ${isCurrentTurn ? 'border-yellow-400 bg-yellow-50 shadow-lg' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {player.isHost && <HostIcon />}
                    <h3 className={`font-semibold text-sm ${isCurrentTurn ? 'text-yellow-800' : ''} ${!player.isConnected ? 'text-gray-500' : ''}`}>
                      {player.name}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Trophy size={12} className="text-yellow-500" />
                    <span className="font-semibold text-sm">{player.totalScore}</span>
                  </div>
                </div>
                
                {/* Cards Grid - Configurable grid layout */}
                <div 
                  className={`grid gap-1 max-w-[140px] mx-auto`}
                  style={{
                    gridTemplateColumns: `repeat(${gameSettings?.cardsGridColumns || 2}, 1fr)`,
                    gridTemplateRows: `repeat(${gameSettings?.cardsGridRows || 2}, 1fr)`
                  }}
                >
                  {player.cards.map((card: any, cardIndex: number) => {
                    const isMyCard = currentPlayerId === player.id;
                    
                    // Determine if card should be hidden
                    let isHidden = false;
                    
                    if (isMyCard) {
                      // For current player's cards, they should be hidden during gameplay
                      // unless they're specifically revealed for replacement selection
                      isHidden = true;
                      
                      // Only show cards that are explicitly marked as visible by the engine
                      // or cards that are selected for replacement
                      if (card && !(card.suit === 'hidden' || card.rank === 'hidden')) {
                        isHidden = false;
                      }
                    } else {
                      // For other players, always hide cards
                      isHidden = true;
                    }
                    
                    // Check if this card is selected for replacement - only show for current player
                    const isSelectedForReplacement = selectedCardIndex === cardIndex && canReplace && isMyCard;
                    // Check if this card was just replaced (show highlight for a few seconds)
                    const wasJustReplaced = lastReplacedCard && 
                      lastReplacedCard.playerId === player.id && 
                      lastReplacedCard.cardIndex === cardIndex;
                    
                    // Swap trick card selection
                    const isSwapSourceCard = isMyCard && isTrickActive && isMyTrick && activeTrick?.type === 'swap' && swapSourceCardIndex === cardIndex;
                    const isSwapTargetCard = !isMyCard && isTrickActive && isMyTrick && activeTrick?.type === 'swap' && 
                      swapTargetPlayerId === player.id && swapTargetCardIndex === cardIndex;
                    
                    // Spy trick card selection
                    const isSpyTargetCard = isTrickActive && isMyTrick && activeTrick?.type === 'spy' && 
                      spyTargetPlayerId === player.id && spyTargetCardIndex === cardIndex;
                    
                    return (
                      <div key={cardIndex} className="relative">
                        <PlayingCard
                          card={card}
                          isHidden={isHidden}
                          isSelected={isSelectedForReplacement}
                          onClick={() => onCardClick(player.id, cardIndex)}
                          className={`
                            ${isSelectedForReplacement ? 'ring-4 ring-purple-500 ring-opacity-75 scale-110' : ''}
                            ${wasJustReplaced ? 'ring-4 ring-green-500 ring-opacity-75 scale-110' : ''}
                            ${isSwapSourceCard ? 'ring-4 ring-red-500 ring-opacity-75 scale-110' : ''}
                            ${isSwapTargetCard ? 'ring-4 ring-red-500 ring-opacity-75 scale-110' : ''}
                            ${isSpyTargetCard ? 'ring-4 ring-blue-500 ring-opacity-75 scale-110' : ''}
                            ${(isMyCard && isTrickActive && isMyTrick && activeTrick?.type === 'swap') || 
                              (!isMyCard && isTrickActive && isMyTrick && activeTrick?.type === 'swap' && swapSourceCardIndex !== null && swapTargetPlayerId === player.id) ||
                              (isTrickActive && isMyTrick && activeTrick?.type === 'spy')
                              ? 'cursor-pointer hover:scale-105' : ''}
                            transition-all duration-200
                          `}
                        />
                        
                        {/* Selection indicator */}
                        {isSelectedForReplacement && (
                          <div className="absolute -top-2 -left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold z-10">
                            SELECTED
                          </div>
                        )}
                        
                        {/* Replacement indicator */}
                        {wasJustReplaced && (
                          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold z-10">
                            REPLACED
                          </div>
                        )}
                        
                        {/* Swap selection indicators */}
                        {isSwapSourceCard && (
                          <div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold z-10">
                            YOUR CARD
                          </div>
                        )}
                        
                        {isSwapTargetCard && (
                          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold z-10">
                            TARGET CARD
                          </div>
                        )}
                        
                        {isSpyTargetCard && (
                          <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold z-10">
                            SPY TARGET
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {player.roundScore > 0 && (
                  <p className="text-center mt-1 text-xs text-gray-600">
                    Round: {player.roundScore}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
