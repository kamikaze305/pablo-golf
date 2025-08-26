import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { PlayingCard } from '../components/PlayingCard';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RotateCcw, 
  MessageSquare, 
  Trophy,
  LogOut,
  Play,
  SkipForward
} from 'lucide-react';

export function GamePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const {
    gameState,
    currentPlayer,
    isConnected,
    roomId: storeRoomId,
    executeAction,
    leaveRoom,
    sendChatMessage,
    isLoading
  } = useGameStore();

  const [chatMessage, setChatMessage] = useState('');
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);
       const [pabloTimer, setPabloTimer] = useState<number | null>(null);
    const [pabloCountdown, setPabloCountdown] = useState<number>(15);
    const [roundEndTimer, setRoundEndTimer] = useState<number>(30);

  // Calculate game state variables
  const isMyTurn = gameState?.currentPlayerIndex !== undefined && 
                   currentPlayer && 
                   gameState.players[gameState.currentPlayerIndex]?.id === currentPlayer.id;

  const isPabloWindow = gameState?.lastAction?.type === 'pabloWindow';
  const canDraw = isMyTurn && gameState?.gamePhase === 'playing' && !gameState?.lastAction?.type;
  const canReplace = isMyTurn && gameState?.lastAction?.type === 'draw';
  const canDiscard = isMyTurn && gameState?.lastAction?.type === 'draw';
  const canCallPablo = isMyTurn && gameState?.gamePhase === 'playing' && !isPabloWindow && !gameState?.lastAction?.type && !gameState?.pabloCalled && !gameState?.finalRoundStarted;
  const isFinalRound = gameState?.finalRoundStarted;
  const pabloCaller = gameState?.pabloCallerId ? gameState.players.find(p => p.id === gameState.pabloCallerId) : null;

  // Add these debug logs
  console.log('GamePage: Component rendered');
  console.log('GamePage: isConnected =', isConnected);
  console.log('GamePage: gameState =', gameState);
  console.log('GamePage: storeRoomId =', storeRoomId);
  console.log('GamePage: currentPlayer from store:', useGameStore.getState().currentPlayer);
  console.log('GamePage: playerId from store:', useGameStore.getState().playerId);

  // Redirect if not in a room
  useEffect(() => {
    if (!storeRoomId && !isLoading) {
      navigate('/');
    }
  }, [storeRoomId, isLoading, navigate]);

  // Auto-connect and auto-reconnect when component mounts
  useEffect(() => {
    const attemptReconnection = async () => {
      // Only attempt reconnection if:
      // 1. Not connected to socket AND
      // 2. Not already in a room AND
      // 3. Not currently loading
      if (!isConnected && !storeRoomId && !isLoading) {
        console.log('GamePage: Attempting to connect...');
        useGameStore.getState().connect();
        
        // Try to auto-reconnect if we have saved session data
        const { autoReconnect } = useGameStore.getState();
        const reconnected = await autoReconnect();
        if (reconnected) {
          console.log('GamePage: Auto-reconnected successfully');
        } else {
          console.log('GamePage: No saved session or auto-reconnect failed');
        }
      }
    };
    
    attemptReconnection();
  }, [isConnected, storeRoomId, isLoading]);

  // Pablo window timer
  useEffect(() => {
    console.log('GamePage: Pablo window timer effect triggered');
    console.log('GamePage: isPabloWindow =', isPabloWindow);
    console.log('GamePage: currentPlayer?.id =', currentPlayer?.id);
    console.log('GamePage: gameState?.lastAction =', gameState?.lastAction);
    
         if (isPabloWindow && currentPlayer?.id && !gameState?.finalRoundStarted) {
      console.log('GamePage: Starting Pablo window timer');
      setPabloCountdown(15);
      
      const countdownInterval = setInterval(() => {
        setPabloCountdown(prev => {
          console.log('GamePage: Countdown tick, prev:', prev);
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 1; // Keep it at 1 second instead of 0
          }
          return prev - 1;
        });
      }, 1000);
      
      const timer = setTimeout(() => {
        console.log('GamePage: Pablo window expired, moving to next player');
        console.log('GamePage: Current player ID:', currentPlayer.id);
        console.log('GamePage: Current game state before pabloWindow action:', {
          currentPlayerIndex: gameState?.currentPlayerIndex,
          lastAction: gameState?.lastAction,
          isPabloWindow: gameState?.lastAction?.type === 'pabloWindow'
        });
        clearInterval(countdownInterval);
        executeAction({ type: 'pabloWindow', playerId: currentPlayer.id });
        setPabloTimer(null);
        setPabloCountdown(15);
        console.log('GamePage: Pablo window action executed');
      }, 15000); // 15 seconds
      
      setPabloTimer(timer);
      
      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
        setPabloTimer(null);
        setPabloCountdown(15);
      };
    } else if (pabloTimer) {
      console.log('GamePage: Clearing Pablo timer because conditions not met');
      clearTimeout(pabloTimer);
      setPabloTimer(null);
      setPabloCountdown(15);
    }
     }, [isPabloWindow, currentPlayer?.id, executeAction]);



    // Round end timer
    useEffect(() => {
      if (gameState?.gamePhase === 'roundEnd' && gameState?.roundEndTimer !== undefined) {
        setRoundEndTimer(gameState.roundEndTimer);
        
        const interval = setInterval(() => {
          setRoundEndTimer(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              // Auto-start next round when timer reaches 0
              if (currentPlayer?.isHost) {
                console.log('GamePage: Auto-starting next round');
                executeAction({ type: 'startRound' });
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(interval);
      }
    }, [gameState?.gamePhase, gameState?.roundEndTimer, currentPlayer?.isHost, executeAction]);

   // Debug state changes
  useEffect(() => {
    console.log('GamePage: State change detected:', {
      currentPlayerIndex: gameState?.currentPlayerIndex,
      lastAction: gameState?.lastAction,
      isPabloWindow: gameState?.lastAction?.type === 'pabloWindow',
      currentPlayerId: currentPlayer?.id,
      isMyTurn: isMyTurn,
      canDraw: canDraw,
      canCallPablo: canCallPablo
    });
  }, [gameState?.currentPlayerIndex, gameState?.lastAction, currentPlayer?.id, isMyTurn, canDraw, canCallPablo]);

  const handleStartRound = () => {
    executeAction({ type: 'startRound' });
  };

  const handleDrawFromStock = () => {
    if (currentPlayer?.id) {
      executeAction({ type: 'draw', source: 'stock', playerId: currentPlayer.id });
    }
  };

  const handleDrawFromDiscard = () => {
    if (currentPlayer?.id) {
      executeAction({ type: 'draw', source: 'discard', playerId: currentPlayer.id });
    }
  };

  const handleReplaceCard = () => {
    console.log('GamePage: handleReplaceCard called');
    console.log('GamePage: selectedCardIndex =', selectedCardIndex);
    console.log('GamePage: lastAction =', gameState?.lastAction);
    console.log('GamePage: currentPlayer?.id =', currentPlayer?.id);
    
    if (selectedCardIndex !== null && gameState?.lastAction?.type === 'draw' && currentPlayer?.id) {
      console.log('GamePage: Executing replace action');
      executeAction({ 
        type: 'replace', 
        playerId: currentPlayer.id,
        cardIndex: selectedCardIndex
      });
      setSelectedCardIndex(null);
    } else {
      console.log('GamePage: Replace conditions not met');
    }
  };

  const handleDiscardCard = () => {
    console.log('GamePage: handleDiscardCard called');
    console.log('GamePage: lastAction =', gameState?.lastAction);
    console.log('GamePage: currentPlayer?.id =', currentPlayer?.id);
    
    if (gameState?.lastAction?.type === 'draw' && currentPlayer?.id) {
      console.log('GamePage: Executing discard action');
      executeAction({ 
        type: 'discard', 
        playerId: currentPlayer.id
      });
    } else {
      console.log('GamePage: Discard conditions not met');
    }
  };

  const handleCallPablo = () => {
    console.log('GamePage: handleCallPablo called');
    console.log('GamePage: currentPlayer?.id =', currentPlayer?.id);
    if (currentPlayer?.id) {
      console.log('GamePage: Executing callPablo action');
      executeAction({ type: 'callPablo', playerId: currentPlayer.id });
    } else {
      console.log('GamePage: No currentPlayer.id available');
    }
  };

  const handleSkipPablo = () => {
    console.log('GamePage: handleSkipPablo called');
    console.log('GamePage: currentPlayer?.id =', currentPlayer?.id);
    if (currentPlayer?.id) {
      console.log('GamePage: Executing pabloWindow action (skip)');
      executeAction({ type: 'pabloWindow', playerId: currentPlayer.id });
    } else {
      console.log('GamePage: No currentPlayer.id available');
    }
  };

  const handlePeekCard = (cardIndex: number) => {
    console.log('GamePage: handlePeekCard called for card index:', cardIndex);
    if (currentPlayer?.id) {
      console.log('GamePage: Executing peekCard action');
      executeAction({ type: 'peekCard', playerId: currentPlayer.id, cardIndex });
    } else {
      console.log('GamePage: No currentPlayer.id available');
    }
  };

  const handlePlayerReady = () => {
    console.log('GamePage: handlePlayerReady called');
    if (currentPlayer?.id) {
      console.log('GamePage: Executing playerReady action');
      executeAction({ type: 'playerReady', playerId: currentPlayer.id });
    } else {
      console.log('GamePage: No currentPlayer.id available');
    }
  };

  const handleCopyPlayerId = async () => {
    if (currentPlayer?.id) {
      try {
        const idToCopy = currentPlayer.shortId || currentPlayer.id;
        await navigator.clipboard.writeText(idToCopy);
        console.log('GamePage: Player ID copied to clipboard');
        // You could add a toast notification here
      } catch (err) {
        console.error('GamePage: Failed to copy player ID:', err);
      }
    }
  };

  const handlePowerCard = (powerType: '7' | '8' | '9' | '10' | 'J' | 'Q', payload?: any) => {
    if (currentPlayer?.id) {
      executeAction({ type: 'power', powerType, playerId: currentPlayer.id, payload });
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/');
  };

  const handleEndGame = () => {
    if (currentPlayer?.isHost) {
      executeAction({ type: 'endGame', playerId: currentPlayer.id });
    }
  };

  const handleSendChat = () => {
    if (chatMessage.trim()) {
      sendChatMessage(chatMessage.trim());
      setChatMessage('');
    }
  };

  // Debug logging
  console.log('GamePage: Turn state - isMyTurn:', isMyTurn, 'canDraw:', canDraw, 'canCallPablo:', canCallPablo, 'isPabloWindow:', isPabloWindow);
  console.log('GamePage: Game state - phase:', gameState?.gamePhase, 'lastAction:', gameState?.lastAction);
  console.log('GamePage: Pablo countdown:', pabloCountdown);
  console.log('GamePage: Pablo window condition check:', {
    isPabloWindow,
    currentPlayerId: currentPlayer?.id,
    lastActionPlayerId: (gameState?.lastAction as any)?.playerId,
    condition: isPabloWindow && currentPlayer?.id === (gameState?.lastAction as any)?.playerId
  });

           if (!gameState) {
      return (
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading game...</p>
          </div>
        </div>
      );
    }

    // Host Disconnection Screen
    const hostPlayer = gameState.players.find(p => p.isHost);
    if (hostPlayer && !hostPlayer.isConnected) {
      return (
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg shadow-md p-6 text-center">
            <div className="text-6xl mb-4">👋</div>
            <h1 className="text-2xl font-bold text-red-800 mb-4">Host Left the Game</h1>
            <p className="text-red-700 mb-6">
              The host ({hostPlayer.name}) has left the game. The game has ended.
            </p>
            <button
              onClick={() => {
                leaveRoom();
                navigate('/');
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Create New Game
            </button>
          </div>
        </div>
      );
    }

       // Game End Display
    if (gameState.gamePhase === 'finished') {
      // Sort players by total score (lowest first for winner)
      const sortedPlayers = [...gameState.players].sort((a, b) => a.totalScore - b.totalScore);
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
                    <h3 className="font-semibold text-lg">
                      {player.name} {player.isHost && '(Host)'}
                    </h3>
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
                  <div className="grid grid-cols-2 gap-2 max-w-[120px] mx-auto mb-3">
                    {player.cards.map((card, cardIndex) => (
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
                       {player.cards.map((card, cardIndex) => (
                         <div key={cardIndex} className="flex justify-between">
                           <span>Card {cardIndex + 1}:</span>
                           <span className="font-mono">
                             {card ? (card.isJoker ? `JOKER (${card.value})` : `${card.rank}${card.suit} (${card.value})`) : 'Empty (0)'}
                           </span>
                         </div>
                       ))}
                     </div>
                     
                     {/* Round History */}
                     {gameState.roundHistory && gameState.roundHistory.length > 0 && (
                       <div className="mt-2 pt-2 border-t border-gray-200">
                         <div className="font-medium mb-1">Round History:</div>
                         <div className="space-y-1">
                           {gameState.roundHistory.map((round, roundIndex) => {
                             const playerRoundScore = round.roundDeltas[player.id] || 0;
                             // Calculate cumulative total up to this round
                             let cumulativeTotal = 0;
                             for (let i = 0; i <= roundIndex; i++) {
                               cumulativeTotal += gameState.roundHistory[i].roundDeltas[player.id] || 0;
                             }
                             return (
                               <div key={roundIndex} className="flex justify-between text-xs">
                                 <span>R{round.roundNumber}:</span>
                                 <span className={`font-mono ${playerRoundScore > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                   {playerRoundScore > 0 ? '+' : ''}{playerRoundScore} (Total: {cumulativeTotal})
                                 </span>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     )}
                   </div>
                </div>
              ))}
            </div>

            {/* Pablo Caller Info */}
            {gameState.pabloCalled && gameState.pabloCallerId && (() => {
              const pabloCaller = gameState.players.find(p => p.id === gameState.pabloCallerId);
              const callerScore = pabloCaller?.totalScore || 0;
              const isWinner = pabloCaller?.id === winner.id;
              
              return (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">
                    Pablo called by <span className="font-bold">{pabloCaller?.name}</span>
                  </h3>
                  <p className="text-yellow-700">
                    {isWinner 
                      ? `🎉 They won the game with the lowest score!` 
                      : `They finished with ${callerScore} points`
                    }
                  </p>
                </div>
              );
            })()}

            {/* Play Again Button - Only for Host */}
            {currentPlayer?.isHost && (
              <div className="text-center">
                <button
                  onClick={() => {
                    console.log('GamePage: Resetting game...');
                    executeAction({ type: 'resetGame' });
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 font-semibold text-lg"
                >
                  🎮 Play Again!
                </button>
              </div>
            )}
            
            {/* Non-host message */}
            {!currentPlayer?.isHost && (
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

    // Round End Display
    if (gameState.gamePhase === 'roundEnd') {
     return (
       <div className="max-w-7xl mx-auto p-4">
         <div className="bg-white rounded-lg shadow-md p-6">
           <div className="text-center mb-6">
             <h1 className="text-3xl font-bold text-gray-900 mb-2">Round {gameState.roundNumber} Complete!</h1>
             <div className="text-lg text-gray-600 mb-4">
               Next round starts in <span className="font-bold text-blue-600">{roundEndTimer}</span> seconds
             </div>
           </div>

           {/* Round Results */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
             {gameState.players.map((player) => (
               <div key={player.id} className="border rounded-lg p-4">
                 <div className="flex items-center justify-between mb-3">
                   <h3 className="font-semibold text-lg">
                     {player.name} {player.isHost && '(Host)'}
                   </h3>
                                       <div className="text-right">
                      <div className="text-sm text-gray-600">Round Score</div>
                      <div className={`text-lg font-bold ${player.roundScore > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {player.roundScore > 0 ? '+' : ''}{player.roundScore}
                      </div>
                      <div className="text-sm text-gray-600">Game Total</div>
                      <div className="text-lg font-bold text-blue-600">
                        {player.totalScore}
                      </div>
                    </div>
                 </div>
                 
                                   {/* Show all cards */}
                  <div className="grid grid-cols-2 gap-2 max-w-[120px] mx-auto">
                    {player.cards.map((card, cardIndex) => (
                      <PlayingCard
                        key={cardIndex}
                        card={card}
                      />
                    ))}
                  </div>
                 
                                   <div className="text-center mt-2">
                    <div className="text-sm text-gray-600">Total Score: {player.totalScore}</div>
                    
                    {/* Score Calculation */}
                    <div className="mt-2 text-xs text-gray-500">
                      <div className="font-medium mb-1">Score Breakdown:</div>
                      <div className="space-y-1">
                        {player.cards.map((card, cardIndex) => (
                          <div key={cardIndex} className="flex justify-between">
                            <span>Card {cardIndex + 1}:</span>
                            <span className="font-mono">
                              {card ? (card.isJoker ? `JOKER (${card.value})` : `${card.rank}${card.suit} (${card.value})`) : 'Empty (0)'}
                            </span>
                          </div>
                        ))}
                        <div className="border-t pt-1 font-medium">
                          <span>Round Total: {player.roundScore}</span>
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
             ))}
           </div>

                       {/* Pablo Caller Info */}
            {gameState.pabloCalled && gameState.pabloCallerId && (() => {
              const pabloCaller = gameState.players.find(p => p.id === gameState.pabloCallerId);
              const callerScore = pabloCaller?.roundScore || 0;
              const lowestScore = Math.min(...gameState.players.map(p => p.roundScore));
              const lowestPlayer = gameState.players.find(p => p.roundScore === lowestScore);
              const isWinner = callerScore === lowestScore;
              
              return (
                                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                   <h3 className="font-semibold text-yellow-800 mb-2">
                     Pablo called by <span className="font-bold">{pabloCaller?.name}</span>
                   </h3>
                   <p className="text-yellow-700">
                     {isWinner 
                       ? `They won with lowest total: ${lowestScore}` 
                       : <>They lost: lowest total is {lowestScore} with player <span className="font-bold">{lowestPlayer?.name}</span></>
                     }
                   </p>
                 </div>
              );
            })()}
         </div>
       </div>
     );
       }

    // Peeking Phase Display
    if (gameState.gamePhase === 'peeking') {
      const currentPlayerPeekedCards = gameState.peekedCards?.[currentPlayer?.id || ''] || [];
      const canPeekMore = currentPlayerPeekedCards.length < 2;

      return (
        <div className="max-w-7xl mx-auto p-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Round {gameState.roundNumber} - Peek at Your Cards!</h1>
              <div className="text-lg text-gray-600 mb-4">
                Choose 2 cards to peek at, then click "Ready" when you're done
              </div>
              <div className="text-sm text-gray-500">
                You've peeked at {currentPlayerPeekedCards.length}/2 cards
              </div>
            </div>

            {/* Player Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {gameState.players.map((player) => {
                const isCurrentPlayer = currentPlayer?.id === player.id;
                const playerPeekedCards = gameState.peekedCards?.[player.id] || [];
                
                return (
                  <div key={player.id} className={`border rounded-lg p-4 ${isCurrentPlayer ? 'border-blue-400 bg-blue-50' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">
                        {player.name} {player.isHost && '(Host)'}
                        {isCurrentPlayer && ' (You)'}
                      </h3>
                      {/* Ready Status Indicator */}
                      {gameState.readyPlayers?.includes(player.id) && (
                        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                          <span className="mr-1">✓</span>
                          Ready
                        </div>
                      )}
                    </div>
                    
                    {/* Cards Grid */}
                    <div className="grid grid-cols-2 gap-2 max-w-[120px] mx-auto">
                      {player.cards.map((card, cardIndex) => {
                        const isPeeked = playerPeekedCards.includes(cardIndex);
                        const isMyCard = isCurrentPlayer;
                        const canClick = isMyCard && canPeekMore && !isPeeked;
                        
                        return (
                          <div key={cardIndex} className="relative">
                            <PlayingCard
                              card={card}
                              isHidden={!isPeeked}
                              onClick={canClick ? () => handlePeekCard(cardIndex) : undefined}
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

            {/* Instructions and Ready Button */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
              <ul className="text-sm text-blue-700 space-y-1 mb-4">
                <li>• Click on any 2 of your 4 cards to peek at them</li>
                <li>• Memorize your cards - they will be hidden after peeking</li>
                <li>• Click "Ready" when you're done peeking</li>
                <li>• Game starts when all players are ready</li>
              </ul>
              
              {/* Ready Button */}
              {currentPlayer && (
                <div className="text-center">
                  <button
                    onClick={handlePlayerReady}
                    disabled={currentPlayerPeekedCards.length < 2}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                      currentPlayerPeekedCards.length >= 2
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {currentPlayerPeekedCards.length >= 2 ? 'Ready!' : `Peek ${2 - currentPlayerPeekedCards.length} more card${2 - currentPlayerPeekedCards.length === 1 ? '' : 's'}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
    <div className="max-w-7xl mx-auto p-4">
             {/* Header */}
       <div className="bg-white rounded-lg shadow-md p-4 mb-4">
         <div className="flex items-center justify-between">
           <div>
                           <h1 className="text-2xl font-bold text-gray-900">Room: {gameState?.settings?.roomKey || roomId}</h1>
              
              {/* Sharable Link */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-green-700 font-medium">Share this link to invite players:</p>
                    <p className="text-xs text-green-600 font-mono break-all">
                      {window.location.origin}/join/{gameState?.settings?.roomKey || roomId}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/join/${gameState?.settings?.roomKey || roomId}`);
                      // You could add a toast notification here
                    }}
                    className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                    title="Copy room link"
                  >
                    Copy
                  </button>
                </div>
              </div>
             
             {/* Player Profile */}
             {currentPlayer && (
               <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                 <div className="flex items-center justify-between">
                   <div>
                     <h3 className="font-semibold text-blue-900">Playing as: {currentPlayer.name}</h3>
                                           <div className="flex items-center space-x-2">
                        <p className="text-sm text-blue-700">Player ID: {currentPlayer.shortId || currentPlayer.id}</p>
                        <button
                          onClick={handleCopyPlayerId}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                          title="Copy Player ID to clipboard"
                        >
                          Copy
                        </button>
                      </div>
                     <p className="text-xs text-blue-600 mt-1">
                       💡 Save this ID to rejoin if disconnected
                     </p>
                   </div>
                   <div className="text-right">
                     <div className="text-sm text-blue-600">
                       Total Score: {currentPlayer.totalScore}
                     </div>
                     {currentPlayer.roundScore > 0 && (
                       <div className="text-sm text-blue-600">
                         Round Score: {currentPlayer.roundScore}
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             )}
             
             <p className="text-gray-600">
                Phase: {gameState.gamePhase} | Round: {gameState.roundNumber}
                {isFinalRound && (
                  <span className="ml-2 text-red-600 font-semibold">
                    🚨 FINAL ROUND - Pablo called by {pabloCaller?.name}!
                  </span>
                )}
              </p>
           </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Connected Players</p>
              <p className="font-semibold">{gameState.players.filter(p => p.isConnected).length}/{gameState.players.length}</p>
            </div>
            {currentPlayer?.isHost && (
              <button
                onClick={handleEndGame}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                title="End the game immediately (Host only)"
              >
                <Trophy size={16} />
                <span>End Game</span>
              </button>
            )}
            <button
              onClick={handleLeaveRoom}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut size={16} />
              <span>Leave Room</span>
            </button>
          </div>
        </div>
      </div>

             <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
         {/* Game Board - Compact Layout */}
         <div className="lg:col-span-3">
           <div className="bg-white rounded-lg shadow-md p-4">
             <h2 className="text-lg font-semibold mb-3">Game Board</h2>
             
             {/* Stock and Discard - Compact */}
             <div className="flex justify-center space-x-6 mb-4">
               <div className="text-center">
                 <div className="w-12 h-16 bg-blue-100 border-2 border-blue-300 rounded-lg flex items-center justify-center mb-1">
                   <span className="text-blue-600 font-bold text-sm">{gameState.stock.length}</span>
                 </div>
                 <p className="text-xs text-gray-600">Stock</p>
               </div>
               
               <div className="text-center">
                 <div className="w-12 h-16 bg-green-100 border-2 border-green-300 rounded-lg flex items-center justify-center mb-1">
                   {gameState.discard.length > 0 ? (
                     <div className="text-center">
                       <div className="text-sm font-bold text-green-800">{gameState.discard[gameState.discard.length - 1].rank}</div>
                       <div className="text-xs text-green-600">{gameState.discard[gameState.discard.length - 1].suit}</div>
                     </div>
                   ) : (
                     <span className="text-green-600 font-bold text-xs">Empty</span>
                   )}
                 </div>
                 <p className="text-xs text-gray-600">Discard ({gameState.discard.length})</p>
               </div>
             </div>

                           {/* Player Cards Grid - Compact */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {gameState.players.map((player) => {
                  const isCurrentTurn = gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === player.id);
                   
                                       return (
                      <div key={player.id} className={`border rounded-lg p-3 ${isCurrentTurn ? 'border-yellow-400 bg-yellow-50 shadow-lg' : ''}`}>
                                                                                                 <div className="flex items-center justify-between mb-2">
                          <h3 className={`font-semibold text-sm ${isCurrentTurn ? 'text-yellow-800' : ''} ${!player.isConnected ? 'text-gray-500' : ''}`}>
                            {player.name} {player.isHost && '(H)'}
                            {isCurrentTurn && ' 🎯 (Current)'}
                            {!player.isConnected && ' (Player Left)'}
                          </h3>
                          <div className="flex items-center space-x-1">
                            {!player.isConnected && (
                              <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                Left
                              </div>
                            )}
                            <Trophy size={12} className="text-yellow-500" />
                            <span className="font-semibold text-sm">{player.totalScore}</span>
                          </div>
                        </div>
                       
                                               {/* Cards Grid - Compact */}
                        <div className="grid grid-cols-2 gap-1 max-w-[120px] mx-auto">
                          {player.cards.map((card, cardIndex) => {
                            const isMyCard = currentPlayer?.id === player.id;
                            const isHidden = card && card.suit === 'hidden';
                            const isPeekable = isMyCard && cardIndex >= 2 && gameState.gamePhase === 'playing';
                            
                            return (
                              <PlayingCard
                                key={cardIndex}
                                card={card}
                                isHidden={isHidden}
                                isSelected={selectedCardIndex === cardIndex && canReplace}
                                isPeekable={isPeekable}
                                onClick={() => {
                                  if (isMyCard && canReplace) {
                                    setSelectedCardIndex(cardIndex);
                                  }
                                }}
                              />
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

                 {/* Game Controls - Compact */}
         <div className="space-y-3">
           {/* Game Actions */}
           <div className="bg-white rounded-lg shadow-md p-3">
             <h3 className="font-semibold mb-2 text-sm">Game Actions</h3>
             
             {/* Final Round Warning */}
             {isFinalRound && (
               <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
                 <h4 className="font-semibold text-red-800 mb-1 text-sm">🚨 Final Round Active!</h4>
                 <p className="text-xs text-red-700">
                   Pablo was called by {pabloCaller?.name}. Every player gets one final turn, then the round ends.
                 </p>
               </div>
             )}
             
                           <div className="space-y-1">
                {/* Show "Be Patient" message for non-current players */}
                {!isMyTurn && gameState.gamePhase === 'playing' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-gray-600 text-sm font-medium">⏳ Psst. Be patient.</p>
                    <p className="text-gray-500 text-xs">Other players are finishing their turn</p>
                  </div>
                )}
                
                {gameState.gamePhase === 'waiting' && (
                  <button
                    onClick={handleStartRound}
                    disabled={!currentPlayer?.isHost}
                    className="w-full flex items-center justify-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Play size={14} />
                    <span>Start Round</span>
                  </button>
                )}
                
                {canDraw && (
                 <>
                   <button
                     onClick={handleDrawFromStock}
                     className="w-full flex items-center justify-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                   >
                     <ArrowDownCircle size={14} />
                     <span>Draw from Stock</span>
                   </button>
                   
                   <button
                     onClick={handleDrawFromDiscard}
                     className="w-full flex items-center justify-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                   >
                     <ArrowUpCircle size={14} />
                     <span>Draw from Discard</span>
                   </button>
                 </>
               )}
              
                                             {/* Drawn Card Display */}
                {gameState.lastAction?.type === 'draw' && currentPlayer?.id === gameState.lastAction.playerId && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-2">
                    <h4 className="font-semibold text-yellow-800 mb-1 text-sm">Drawn Card</h4>
                    <div className="flex items-center justify-center">
                      <PlayingCard
                        card={gameState.lastAction.card || null}
                        className="border-2 border-yellow-300"
                      />
                    </div>
                    <p className="text-xs text-yellow-700 mt-1 text-center">
                      Select a card from your hand to replace
                    </p>
                  </div>
                )}

                             {canReplace && (
                 <button
                   onClick={handleReplaceCard}
                   disabled={selectedCardIndex === null}
                   className="w-full flex items-center justify-center space-x-1 px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                 >
                   <RotateCcw size={14} />
                   <span>Replace Card</span>
                 </button>
               )}

               {canDiscard && (
                 <button
                   onClick={handleDiscardCard}
                   className="w-full flex items-center justify-center space-x-1 px-3 py-1.5 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
                 >
                   <SkipForward size={14} />
                   <span>Discard Drawn Card</span>
                 </button>
               )}
               
               {canCallPablo && (
                 <button
                   onClick={handleCallPablo}
                   className="w-full flex items-center justify-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                 >
                   <SkipForward size={14} />
                   <span>Call Pablo!</span>
                 </button>
               )}

                                                                              {/* Pablo Window Display */}
               {isPabloWindow && currentPlayer?.id === (gameState.lastAction as any)?.playerId && (
                 <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
                   <h4 className="font-semibold text-red-800 mb-1 text-sm">Pablo Window - {pabloCountdown}s</h4>
                   <p className="text-xs text-red-700 text-center mb-2">
                     Call Pablo or skip to end turn
                   </p>
                   <div className="space-y-1">
                     <button
                       onClick={handleCallPablo}
                       className="w-full flex items-center justify-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                     >
                       <SkipForward size={14} />
                       <span>Call Pablo Now!</span>
                     </button>
                     <button
                       onClick={handleSkipPablo}
                       className="w-full flex items-center justify-center space-x-1 px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                     >
                       <SkipForward size={14} />
                       <span>Skip Pablo - End Turn</span>
                     </button>
                   </div>
                 </div>
               )}
            </div>
          </div>

                     {/* Power Cards */}
           <div className="bg-white rounded-lg shadow-md p-3">
             <h3 className="font-semibold mb-2 text-sm">Power Cards</h3>
             <div className="space-y-1">
               <button
                 onClick={() => handlePowerCard('7')}
                 disabled={!isMyTurn}
                 className="w-full px-2 py-1 bg-yellow-100 text-yellow-800 rounded border border-yellow-300 hover:bg-yellow-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
               >
                 7 - Swap Cards
               </button>
               <button
                 onClick={() => handlePowerCard('8')}
                 disabled={!isMyTurn}
                 className="w-full px-2 py-1 bg-blue-100 text-blue-800 rounded border border-blue-300 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
               >
                 8 - Spy on Cards
               </button>
             </div>
           </div>

                     {/* Chat */}
           <div className="bg-white rounded-lg shadow-md p-3">
             <div className="flex items-center justify-between mb-2">
               <h3 className="font-semibold text-sm">Chat</h3>
               <button
                 onClick={() => setShowChat(!showChat)}
                 className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 text-sm"
               >
                 <MessageSquare size={14} />
                 <span>{showChat ? 'Hide' : 'Show'}</span>
               </button>
             </div>
             
             {showChat && (
               <div className="space-y-2">
                 <div className="h-24 bg-gray-50 rounded border p-2 text-xs text-gray-600 overflow-y-auto">
                   <p>Chat messages will appear here...</p>
                 </div>
                 <div className="flex space-x-2">
                   <input
                     type="text"
                     value={chatMessage}
                     onChange={(e) => setChatMessage(e.target.value)}
                     onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                     placeholder="Type a message..."
                     className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                   />
                   <button
                     onClick={handleSendChat}
                     className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                   >
                     Send
                   </button>
                 </div>
               </div>
             )}
           </div>

           {/* Players List */}
           <div className="bg-white rounded-lg shadow-md p-3">
             <h3 className="font-semibold mb-2 text-sm">Connected Players</h3>
             <div className="space-y-2">
               {gameState.players.map((player) => (
                 <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                   <div className="flex items-center space-x-2">
                     <div className={`w-2 h-2 rounded-full ${player.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                     <div>
                                               <div className={`font-medium text-xs ${!player.isConnected ? 'text-gray-500' : 'text-gray-900'}`}>
                          {player.name}
                          {player.isHost && <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">H</span>}
                          {gameState.currentPlayerIndex !== undefined && 
                           gameState.players[gameState.currentPlayerIndex]?.id === player.id && 
                           <span className="ml-1 text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">T</span>}
                          {!player.isConnected && <span className="ml-1 text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded">DC</span>}
                        </div>
                       <div className="text-xs text-gray-600">
                         Score: {player.totalScore}
                       </div>
                     </div>
                   </div>
                   <div className="text-right">
                     {player.roundScore > 0 && (
                       <div className="text-xs font-medium text-blue-600">
                         R: {player.roundScore}
                       </div>
                     )}
                   </div>
                 </div>
               ))}
             </div>
           </div>

           {/* Game Info */}
           <div className="bg-white rounded-lg shadow-md p-3">
             <h3 className="font-semibold mb-2 text-sm">Game Info</h3>
             <div className="space-y-1 text-xs">
               <div className="flex justify-between">
                 <span>Phase:</span>
                 <span className="font-medium">{gameState.gamePhase}</span>
               </div>
               <div className="flex justify-between">
                 <span>Round:</span>
                 <span className="font-medium">{gameState.roundNumber}</span>
               </div>
               <div className="flex justify-between">
                 <span>Current:</span>
                 <span className="font-medium">
                   {gameState.players[gameState.currentPlayerIndex]?.name || 'None'}
                 </span>
               </div>
               <div className="flex justify-between">
                 <span>Stock:</span>
                 <span className="font-medium">{gameState.stock.length}</span>
               </div>
               <div className="flex justify-between">
                 <span>Discard:</span>
                 <span className="font-medium">{gameState.discard.length}</span>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
