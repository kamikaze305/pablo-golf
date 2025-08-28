import React, { useState } from 'react';
import { TrickCardState, SwapAction, SpyAction } from '@pablo/engine';

interface TrickCardModalProps {
  activeTrick: TrickCardState;
  players: any[];
  currentPlayerId: string;
  onExecuteSwap: (swapAction: SwapAction) => void;
  onExecuteSpy: (spyAction: SpyAction) => void;
  onSkipTrick: () => void;
  onClose: () => void;
}

export const TrickCardModal: React.FC<TrickCardModalProps> = ({
  activeTrick,
  players,
  currentPlayerId,
  onExecuteSwap,
  onExecuteSpy,
  onSkipTrick,
  onClose
}) => {
  const [swapAction, setSwapAction] = useState<SwapAction>({
    sourcePlayerId: currentPlayerId,
    sourceCardIndex: 0,
    targetPlayerId: '',
    targetCardIndex: 0
  });

  const [spyAction, setSpyAction] = useState<SpyAction>({
    targetPlayerId: '',
    targetCardIndex: 0
  });

  const [showSpyResult, setShowSpyResult] = useState(false);
  const [spyResult, setSpyResult] = useState<any>(null);

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const otherPlayers = players.filter(p => p.id !== currentPlayerId);

  const handleSwapExecute = () => {
    if (swapAction.targetPlayerId && swapAction.sourceCardIndex >= 0) {
      onExecuteSwap(swapAction);
    }
  };

  const handleSpyExecute = () => {
    if (spyAction.targetPlayerId && spyAction.targetCardIndex >= 0) {
      // Find the target card
      const targetPlayer = players.find(p => p.id === spyAction.targetPlayerId);
      if (targetPlayer && targetPlayer.cards[spyAction.targetCardIndex]) {
        setSpyResult(targetPlayer.cards[spyAction.targetCardIndex]);
        setShowSpyResult(true);
        
        // Auto-execute spy after showing result
        setTimeout(() => {
          onExecuteSpy(spyAction);
          setShowSpyResult(false);
        }, 2000);
      }
    }
  };

  if (showSpyResult && spyResult) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-bold mb-4 text-center">Spy Result</h3>
          <div className="text-center mb-4">
            <div className="inline-block bg-red-100 border-2 border-red-500 rounded-lg p-4">
              <div className="text-red-600 font-bold text-xl">
                {spyResult.rank} {spyResult.suit === 'hearts' ? '♥' : 
                                 spyResult.suit === 'diamonds' ? '♦' : 
                                 spyResult.suit === 'clubs' ? '♣' : 
                                 spyResult.suit === 'spades' ? '♠' : '?'}
              </div>
            </div>
          </div>
          <p className="text-center text-gray-600">This card will be hidden in 2 seconds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">
            {activeTrick.cardRank === '7' ? 'Swap Trick' : 'Spy Trick'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">{activeTrick.instructions}</p>
        </div>

        {activeTrick.type === 'swap' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Card to Swap:
              </label>
              <select
                value={swapAction.sourceCardIndex}
                onChange={(e) => setSwapAction({
                  ...swapAction,
                  sourceCardIndex: parseInt(e.target.value)
                })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {currentPlayer?.cards.map((card: any, index: number) => (
                  <option key={index} value={index}>
                    Position {index + 1} {card ? '(Has Card)' : '(Empty)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Player:
              </label>
              <select
                value={swapAction.targetPlayerId}
                onChange={(e) => setSwapAction({
                  ...swapAction,
                  targetPlayerId: e.target.value
                })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a player</option>
                {otherPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            {swapAction.targetPlayerId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Card Position:
                </label>
                <select
                  value={swapAction.targetCardIndex}
                  onChange={(e) => setSwapAction({
                    ...swapAction,
                    targetCardIndex: parseInt(e.target.value)
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {[0, 1, 2, 3].map((index) => (
                    <option key={index} value={index}>
                      Position {index + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex space-x-4 pt-4">
              <button
                onClick={handleSwapExecute}
                disabled={!swapAction.targetPlayerId}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Execute Swap
              </button>
              <button
                onClick={onSkipTrick}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
              >
                Skip Trick
              </button>
            </div>
          </div>
        )}

        {activeTrick.type === 'spy' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Player:
              </label>
              <select
                value={spyAction.targetPlayerId}
                onChange={(e) => setSpyAction({
                  ...spyAction,
                  targetPlayerId: e.target.value
                })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a player</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            {spyAction.targetPlayerId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Card Position:
                </label>
                <select
                  value={spyAction.targetCardIndex}
                  onChange={(e) => setSpyAction({
                    ...spyAction,
                    targetCardIndex: parseInt(e.target.value)
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {[0, 1, 2, 3].map((index) => (
                    <option key={index} value={index}>
                      Position {index + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex space-x-4 pt-4">
              <button
                onClick={handleSpyExecute}
                disabled={!spyAction.targetPlayerId}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Spy on Card
              </button>
              <button
                onClick={onSkipTrick}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
              >
                Skip Trick
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
