import React, { useState, useEffect } from 'react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RotateCcw, 
  SkipForward,
  HelpCircle,
  X
} from 'lucide-react';
import { PlayingCard } from './PlayingCard';

interface GameActionsProps {
  gamePhase: string;
  isMyTurn: boolean;
  canDraw: boolean;
  canReplace: boolean;
  canDiscard: boolean;
  canCallPablo: boolean;
  pabloCallerName?: string;
  isPabloWindow: boolean;
  pabloCountdown: number;
  isTrickActive: boolean;
  isMyTrick: boolean;
  activeTrick: any;
  lastAction: any;
  selectedCardIndex: number | null;
  swapSourceCardIndex: number | null;
  swapTargetPlayerId: string | null;
  swapTargetCardIndex: number | null;
  spyTargetPlayerId: string | null;
  spyTargetCardIndex: number | null;
  playersCount: number;
  players: any[];
  roundNumber: number;
  peekedCards: Record<string, number[]>;
  readyPlayers: string[];
  currentPlayerId?: string;
  currentPlayerIndex?: number;
  isHost?: boolean;
  onDrawFromStock: () => void;
  onDrawFromDiscard: () => void;
  onReplaceCard: () => void;
  onDiscardCard: () => void;
  onCallPablo: () => void;
  onSkipPablo: () => void;
  onExecuteSwap: () => void;
  onExecuteSpy: () => void;
  onSkipTrick: () => void;
  onPlayerReady: () => void;
}

export function GameActions({
  gamePhase,
  isMyTurn,
  canDraw,
  canReplace,
  canDiscard,
  canCallPablo,
  pabloCallerName,
  isPabloWindow,
  pabloCountdown,
  isTrickActive,
  isMyTrick,
  activeTrick,
  lastAction,
  selectedCardIndex,
  swapSourceCardIndex,
  swapTargetPlayerId,
  swapTargetCardIndex,
  spyTargetPlayerId,
  spyTargetCardIndex,
  playersCount,
  players,
  roundNumber,
  peekedCards,
  readyPlayers,
  currentPlayerId,
  currentPlayerIndex,
  isHost,
  onDrawFromStock,
  onDrawFromDiscard,
  onReplaceCard,
  onDiscardCard,
  onCallPablo,
  onSkipPablo,
  onExecuteSwap,
  onExecuteSpy,
  onSkipTrick,
  onPlayerReady
}: GameActionsProps) {
  const [showReplacementHelp, setShowReplacementHelp] = useState(false);
  const [showSwapHelp, setShowSwapHelp] = useState(false);
  const [showSpyHelp, setShowSpyHelp] = useState(false);
  const [showPeekingHelp, setShowPeekingHelp] = useState(false);

  // Auto-mark ready when 2 cards are peeked
  useEffect(() => {
    if (gamePhase === 'peeking' && currentPlayerId && !readyPlayers.includes(currentPlayerId)) {
      const currentPlayerPeekedCards = peekedCards[currentPlayerId] || [];
      if (currentPlayerPeekedCards.length >= 2) {
        // Small delay to allow the UI to update first
        const timer = setTimeout(() => {
          onPlayerReady();
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [gamePhase, currentPlayerId, peekedCards, readyPlayers, onPlayerReady]);

  // Function to get current status message
  const getStatusMessage = () => {
    if (gamePhase === 'waiting') {
      if (playersCount < 2) {
        return '⏳ Waiting for more players to join...';
      }
      return '✅ Waiting for Host to start the game!';
    } else if (gamePhase === 'peeking') {
      // Show ready players with green ticks
      const readyPlayerNames = players
        .filter(player => readyPlayers.includes(player.id))
        .map(player => player.id === currentPlayerId ? 'You' : `Player ${players.findIndex(p => p.id === player.id) + 1}`)
        .map(name => `${name} ✓`);
      
      if (readyPlayerNames.length > 0) {
        return `👀 Peeking phase - ${readyPlayerNames.join(', ')} ready`;
      }
      return '👀 Peeking phase - players are looking at their cards';
    } else if (gamePhase === 'playing') {
      if (isMyTurn) {
        return '🎯 Your turn - make your move!';
      } else {
        // Get the current player's name from the players array
        if (currentPlayerIndex !== undefined && players[currentPlayerIndex]) {
          return `⏳ Waiting for ${players[currentPlayerIndex].name} to play`;
        }
        return '⏳ Waiting for other players...';
      }
    } else if (gamePhase === 'trickActive') {
      if (isMyTrick) {
        return '🎭 Your trick card is active!';
      } else {
        return '🎭 Another player is using a trick card';
      }
    } else if (gamePhase === 'roundEnd') {
      return 'Time to sip your chai ☕ until the host starts the next round.';
    } else if (gamePhase === 'scored') {
      return '📊 Round scores calculated';
    } else if (gamePhase === 'finished') {
      return '🎉 Game finished!';
    }
    return 'Game in progress...';
  };

  // Popup Help Component
  const HelpPopup = ({ 
    isOpen, 
    onClose, 
    title, 
    children 
  }: { 
    isOpen: boolean; 
    onClose: () => void; 
    title: string; 
    children: React.ReactNode; 
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center space-x-3 mb-3">
        <h2 className="text-lg font-semibold">Game Actions</h2>
        <span 
          className="text-xs text-blue-800"
          title={gamePhase === 'peeking' && readyPlayers.length > 0 ? 'Players are ready and waiting for others to complete peeking' : ''}
        >
          {getStatusMessage()}
        </span>
      </div>
      
      {/* Peeking Phase Message and Ready Button */}
      {gamePhase === 'peeking' && currentPlayerId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
          <div className="text-center mb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-blue-800">
                Round {roundNumber} - Peek at Your Cards!
              </h3>
              <button
                onClick={() => setShowPeekingHelp(true)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="Show peeking instructions"
              >
                <HelpCircle size={16} />
              </button>
            </div>
          </div>
          
          {/* Ready Button */}
          <div className="text-center">
            <button
              onClick={onPlayerReady}
              disabled={(peekedCards[currentPlayerId] || []).length < 2 || readyPlayers.includes(currentPlayerId)}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                readyPlayers.includes(currentPlayerId)
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : (peekedCards[currentPlayerId] || []).length >= 2
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {readyPlayers.includes(currentPlayerId) 
                ? 'Ready!' 
                : (peekedCards[currentPlayerId] || []).length >= 2 
                ? 'Ready!' 
                : `Peek ${2 - (peekedCards[currentPlayerId] || []).length} more card${2 - (peekedCards[currentPlayerId] || []).length === 1 ? '' : 's'}`}
            </button>
          </div>


        </div>
      )}
      


      {/* Round End Message */}
      {gamePhase === 'roundEnd' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <h4 className="font-semibold text-blue-800 mb-1 text-sm">🎯 Round {roundNumber} Complete!</h4>
          <p className="text-xs text-blue-700">
            {(() => {
              // Check if Pablo was called and determine the result
              if (pabloCallerName) {
                const pabloCaller = players.find(p => p.name === pabloCallerName);
                if (pabloCaller) {
                  const callerScore = pabloCaller.roundScore || 0;
                  const lowestScore = Math.min(...players.map(p => p.roundScore || 0));
                  const isWinner = callerScore === lowestScore;
                  
                  if (isWinner) {
                    return (
                      <span>
                        ✅ Nailed it! <b>{pabloCallerName}</b> called Pablo and crushed it. {lowestScore} points of pure glory!
                      </span>
                    );
                  } else {
                    // Find highest score among all OTHER players (excluding Pablo caller)
                    const otherPlayers = players.filter(p => p.name !== pabloCallerName);
                    const highestOtherPlayerScore = Math.max(...otherPlayers.map(p => p.roundScore || 0));
                    
                    return (
                      <span>
                        ❌ Bold call, bad timing. Player <b>{pabloCallerName}</b> is not lowest. they get Penalty 💀 of {highestOtherPlayerScore}
                      </span>
                    );
                  }
                }
              }
              return '📊 The cards have spoken! Round scores are in.';
            })()}
          </p>
                    {isHost && (
            <p className="text-xs text-blue-600 mt-1 font-medium">
              As the host, you can start the next round when ready.
            </p>
          )}
        </div>
      )}
      
      <div className="space-y-2">
        
        {canDraw && !isTrickActive && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onDrawFromStock}
              className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              <ArrowDownCircle size={16} />
              <span>Draw from Stock</span>
            </button>
            
            <button
              onClick={onDrawFromDiscard}
              className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
            >
              <ArrowUpCircle size={16} />
              <span>Draw from Discard</span>
            </button>
          </div>
        )}
        
        {/* Drawn Card Display */}
        {lastAction?.type === 'draw' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-yellow-800 text-sm">🎯 Drawn Card - Select Replacement</h4>
              <button
                onClick={() => setShowReplacementHelp(true)}
                className="text-yellow-600 hover:text-yellow-800 transition-colors"
                title="Show replacement instructions"
              >
                <HelpCircle size={16} />
              </button>
            </div>
            <div className="flex items-center justify-center mb-2">
              <PlayingCard
                card={lastAction.card || null}
                className="border-2 border-yellow-300 ring-4 ring-yellow-400 ring-opacity-75 scale-110"
              />
            </div>
          </div>
        )}
        
        {canReplace && !isTrickActive && (
          <button
            onClick={onReplaceCard}
            disabled={selectedCardIndex === null}
            className="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw size={16} />
            <span>Replace Card</span>
          </button>
        )}

        {canDiscard && !isTrickActive && (
          <button
            onClick={onDiscardCard}
            className="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
          >
            <SkipForward size={16} />
            <span>Discard Drawn Card</span>
          </button>
        )}
        
        {canCallPablo && !isTrickActive && (
          <button
            onClick={onCallPablo}
            className="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
          >
            <SkipForward size={16} />
            <span>Call Pablo!</span>
          </button>
        )}

        {/* Trick Card Actions */}
        {isTrickActive && isMyTrick && activeTrick && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-purple-800 text-sm">
                {activeTrick.cardRank === '7' ? '🔄 Swap Trick' : '👁️ Spy Trick'}
              </h4>
              <button
                onClick={() => activeTrick.type === 'swap' ? setShowSwapHelp(true) : setShowSpyHelp(true)}
                className="text-purple-600 hover:text-purple-800 transition-colors"
                title="Show trick instructions"
              >
                <HelpCircle size={16} />
              </button>
            </div>
            
            {activeTrick.type === 'swap' && (
              <div className="space-y-2">
                {/* Status indicators */}
                {swapSourceCardIndex !== null && (
                  <p className="text-xs text-green-600 font-medium text-center">
                    ✓ Your card selected. Now click on opponent's card.
                  </p>
                )}
                {swapSourceCardIndex !== null && swapTargetPlayerId !== null && swapTargetCardIndex !== null && (
                  <p className="text-xs text-green-600 font-medium text-center">
                    ✓ Both cards selected. Ready to swap!
                  </p>
                )}

                {/* Execute Swap Button */}
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={onExecuteSwap}
                    disabled={swapSourceCardIndex === null || swapTargetPlayerId === null || swapTargetCardIndex === null}
                    className="flex-1 bg-purple-600 text-white py-2 px-3 rounded text-sm hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Execute Swap
                  </button>
                  <button
                    onClick={onSkipTrick}
                    className="flex-1 bg-gray-500 text-white py-2 px-3 rounded text-sm hover:bg-gray-600"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {activeTrick.type === 'spy' && (
              <div className="space-y-2">
                {/* Status indicator */}
                {spyTargetPlayerId !== null && spyTargetCardIndex !== null && (
                  <p className="text-xs text-green-600 font-medium text-center">
                    ✓ Card selected. Ready to spy!
                  </p>
                )}

                {/* Execute Spy Button */}
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={onExecuteSpy}
                    disabled={spyTargetPlayerId === null || spyTargetCardIndex === null}
                    className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Spy on Card
                  </button>
                  <button
                    onClick={onSkipTrick}
                    className="flex-1 bg-gray-500 text-white py-2 px-3 rounded text-sm hover:bg-gray-600"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pablo Window Display */}
        {isPabloWindow && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
            <h4 className="font-semibold text-red-800 mb-2 text-sm">Pablo Window - {pabloCountdown}s</h4>
            <div className="space-y-2">
              <button
                onClick={onCallPablo}
                className="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                <SkipForward size={16} />
                <span>Call Pablo Now!</span>
              </button>
              <button
                onClick={onSkipPablo}
                className="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-600 transition-colors"
              >
                <SkipForward size={16} />
                <span>Skip Pablo - End Turn</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help Popups */}
      <HelpPopup
        isOpen={showReplacementHelp}
        onClose={() => setShowReplacementHelp(false)}
        title="Replacement Instructions"
      >
        <div className="space-y-3">
          <p className="text-gray-700">
            When you draw a card, you can replace one of your existing cards with it:
          </p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Click on any card in your hand to select it
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Selected card will be highlighted with purple ring
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Click "Replace Card" button to complete the action
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Or click "Discard Drawn Card" to skip replacement
            </li>
          </ul>
        </div>
      </HelpPopup>

      <HelpPopup
        isOpen={showSwapHelp}
        onClose={() => setShowSwapHelp(false)}
        title="Swap Trick Instructions"
      >
        <div className="space-y-3">
          <p className="text-gray-700">
            The Swap Trick allows you to exchange cards with another player:
          </p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Click on your card first to select it
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Then click on any opponent's card to swap
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Both cards will be highlighted when selected
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Click "Execute Swap" to complete the action
            </li>
          </ul>
        </div>
      </HelpPopup>

      <HelpPopup
        isOpen={showSpyHelp}
        onClose={() => setShowSpyHelp(false)}
        title="Spy Trick Instructions"
      >
        <div className="space-y-3">
          <p className="text-gray-700">
            The Spy Trick allows you to secretly look at any card:
          </p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Click on any card (yours or opponents') to spy on it
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              You'll see the card's value and suit
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              This information is only visible to you
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Click "Spy on Card" to complete the action
            </li>
          </ul>
        </div>
      </HelpPopup>

      <HelpPopup
        isOpen={showPeekingHelp}
        onClose={() => setShowPeekingHelp(false)}
        title="Peeking Phase Instructions"
      >
        <div className="space-y-3">
          <p className="text-gray-700">
            During the peeking phase, you can look at some of your cards:
          </p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Click on any card in your hand to peek at it
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              You must peek at exactly 2 cards
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Once you've peeked at 2 cards, click "Ready!"
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Wait for all players to be ready before the game continues
            </li>
          </ul>
        </div>
      </HelpPopup>
    </div>
  );
}
