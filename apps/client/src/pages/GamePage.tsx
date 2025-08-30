import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { PlayerDetails } from '../components/PlayerDetails';
import { HostActions } from '../components/HostActions';
import { GameActions } from '../components/GameActions';
import { GameBoard } from '../components/GameBoard';
import { GameFooter } from '../components/GameFooter';
import { GameEndDisplay } from '../components/GameEndDisplay';

import { HostDisconnectionScreen } from '../components/HostDisconnectionScreen';
import { Toast } from '../components/Toast';
import { TrickCardModal } from '../components/TrickCardModal';



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
    isLoading
  } = useGameStore();

  
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);

  const [pabloTimer, setPabloTimer] = useState<number | null>(null);
  const [pabloCountdown, setPabloCountdown] = useState<number>(15);
  const [lastReplacedCard, setLastReplacedCard] = useState<{playerId: string, cardIndex: number} | null>(null);
  
  // Toast notification state
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  
  // Copy feedback state
  const [linkCopied, setLinkCopied] = useState<boolean>(false);

  // Reconnection state
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);


  



  // Calculate game state variables
  const isMyTurn = gameState?.currentPlayerIndex !== undefined && 
                   currentPlayer && 
                   gameState.players[gameState.currentPlayerIndex]?.id === currentPlayer.id;

  const isPabloWindow = gameState?.lastAction?.type === 'pabloWindow';
  const canDraw = isMyTurn && gameState?.gamePhase === 'playing' && !gameState?.lastAction?.type;
  const canReplace = isMyTurn && gameState?.lastAction?.type === 'draw';
  const canDiscard = isMyTurn && gameState?.lastAction?.type === 'draw';
  const canCallPablo = isMyTurn && gameState?.gamePhase === 'playing' && !isPabloWindow && !gameState?.lastAction?.type && !gameState?.pabloCalled && !gameState?.finalRoundStarted;
  const pabloCaller = gameState?.pabloCallerId ? gameState.players.find(p => p.id === gameState.pabloCallerId) : null;
  
  // Trick card state
  const isTrickActive = gameState?.gamePhase === 'trickActive';
  const activeTrick = gameState?.activeTrick;
  const isMyTrick = activeTrick?.playerId === currentPlayer?.id;
  
  // Trick card action states
  const [swapSourceCardIndex, setSwapSourceCardIndex] = useState<number | null>(null);
  const [swapTargetPlayerId, setSwapTargetPlayerId] = useState<string>('');
  const [swapTargetCardIndex, setSwapTargetCardIndex] = useState<number | null>(null);
  const [spyTargetPlayerId, setSpyTargetPlayerId] = useState<string>('');
  const [spyTargetCardIndex, setSpyTargetCardIndex] = useState<number | null>(null);
  const [showIncomingCard, setShowIncomingCard] = useState<boolean>(false);
  const [incomingCard, setIncomingCard] = useState<any>(null);



  // Debug logging (only in development)
  if (import.meta.env.DEV) {
    console.log('GamePage: Component rendered');
    console.log('GamePage: Room info:', {
      roomId,
      storeRoomId,
      roomKey: gameState?.settings?.roomKey,
      gameState: gameState ? 'loaded' : 'not loaded'
    });
  }



  // Redirect if not in a room
  useEffect(() => {
    // Only redirect if we're not in a room, not loading, and not attempting to reconnect
    if (!storeRoomId && !isLoading && !isReconnecting) {
      console.log('GamePage: No room ID, not loading, and not reconnecting - redirecting to home');
      navigate('/');
    }
  }, [storeRoomId, isLoading, isReconnecting, navigate]);



  // Trick card state handling
  useEffect(() => {
    console.log('GamePage: Trick card effect triggered');
    console.log('GamePage: isTrickActive =', isTrickActive);
    console.log('GamePage: isMyTrick =', isMyTrick);
    console.log('GamePage: activeTrick =', activeTrick);
    console.log('GamePage: gamePhase =', gameState?.gamePhase);
    console.log('GamePage: lastAction =', gameState?.lastAction);
    
         // Reset trick card states when trick is not active
         if (!isTrickActive || !isMyTrick || !activeTrick) {
           setSwapSourceCardIndex(null);
           setSwapTargetPlayerId('');
           setSwapTargetCardIndex(null);
           setSpyTargetPlayerId('');
           setSpyTargetCardIndex(null);
           setShowIncomingCard(false);
           setIncomingCard(null);
         }
       }, [isTrickActive, isMyTrick, activeTrick, gameState?.gamePhase, gameState?.lastAction]);

  // Auto-connect and auto-reconnect when component mounts
  useEffect(() => {
    const attemptReconnection = async () => {
      // Only attempt reconnection if:
      // 1. Not connected to socket AND
      // 2. Not already in a room AND
      // 3. Not currently loading AND
      // 4. Not already attempting to reconnect
      if (!isConnected && !storeRoomId && !isLoading && !isReconnecting) {
        console.log('GamePage: Attempting to connect and reconnect...');
        setIsReconnecting(true);
        
        try {
          useGameStore.getState().connect();
          
          // Try to auto-reconnect if we have saved session data
          const { autoReconnect } = useGameStore.getState();
          const reconnected = await autoReconnect();
          if (reconnected) {
            console.log('GamePage: Auto-reconnected successfully');
          } else {
            console.log('GamePage: No saved session or auto-reconnect failed');
          }
        } catch (error) {
          console.error('GamePage: Reconnection attempt failed:', error);
        } finally {
          setIsReconnecting(false);
        }
      }
    };
    
    attemptReconnection();
  }, [isConnected, storeRoomId, isLoading, isReconnecting]);





  // Pablo window timer
  useEffect(() => {
    if (isPabloWindow && currentPlayer?.id && !gameState?.finalRoundStarted) {
      console.log('GamePage: Pablo window started, setting countdown to 15 seconds');
      setPabloCountdown(15);
      
      const countdownInterval = setInterval(() => {
        setPabloCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 1; // Keep it at 1 second instead of 0
          }
          return prev - 1;
        });
      }, 1000);
      
      const timer = setTimeout(() => {
        console.log('GamePage: Pablo countdown expired, executing pabloWindow action');
        clearInterval(countdownInterval);
        executeAction({ type: 'pabloWindow', playerId: currentPlayer.id });
        setPabloTimer(null);
        setPabloCountdown(15);
      }, 15000); // 15 seconds
      
      setPabloTimer(timer);
      
      return () => {
        console.log('GamePage: Pablo window effect cleanup');
        clearTimeout(timer);
        clearInterval(countdownInterval);
        setPabloTimer(null);
        setPabloCountdown(15);
      };
    } else if (pabloTimer) {
      console.log('GamePage: Clearing Pablo timer - Pablo window ended');
      clearTimeout(pabloTimer);
      setPabloTimer(null);
      setPabloCountdown(15);
    }
  }, [isPabloWindow, currentPlayer?.id, executeAction]);



         // Round end timer - removed auto-start functionality
     // Timer functionality removed - host now manually starts next round

     // Debug state changes (only in development)
   useEffect(() => {
     if (import.meta.env.DEV) {
       // Add state change logging here when needed
     }
   }, [gameState?.currentPlayerIndex, gameState?.lastAction, currentPlayer?.id, isMyTurn, canDraw, canCallPablo]);

   // Clear selection when it's not the current player's turn
   useEffect(() => {
     if (!isMyTurn && selectedCardIndex !== null) {
       setSelectedCardIndex(null);
     }
   }, [isMyTurn, selectedCardIndex]);

     // Clear selection when game phase changes
  useEffect(() => {
    if (gameState?.gamePhase !== 'playing' && selectedCardIndex !== null) {
      setSelectedCardIndex(null);
    }
  }, [gameState?.gamePhase, selectedCardIndex]);

  // Check connection status and redirect if disconnected
  useEffect(() => {
    if (!isConnected && gameState) {
      // Clear any pending actions
      setSelectedCardIndex(null);
      setSwapSourceCardIndex(null);
      setSwapTargetPlayerId('');
      setSwapTargetCardIndex(null);
      setSpyTargetPlayerId('');
      setSpyTargetCardIndex(null);
      setShowIncomingCard(false);
      setIncomingCard(null);

      
      // Redirect to landing page with error message
      navigate('/', { 
        state: { 
          error: 'Connection to the game server was lost. Please try to rejoin the game.' 
        } 
      });
    }
  }, [isConnected, gameState, navigate]);

  // Host disconnection auto-redirect
  useEffect(() => {
    const hostPlayer = gameState?.players.find(p => p.isHost);
    if (hostPlayer && !hostPlayer.isConnected) {
      const timer = setTimeout(() => {
        leaveRoom();
        navigate('/');
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [gameState?.players, leaveRoom, navigate]);

  // Conditional returns - must come after all hooks
  // Show reconnection loading state
  if (isReconnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Reconnecting...</h2>
          <p className="text-gray-600">Please wait while we reconnect you to the game.</p>
        </div>
      </div>
    );
  }

  // Show loading state if we don't have a room ID yet
  if (!storeRoomId && (isLoading || isReconnecting)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your game.</p>
        </div>
      </div>
    );
  }

  // Show loading state if we don't have game state yet
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Game...</h2>
          <p className="text-gray-600">Please wait while we load the game state.</p>
        </div>
      </div>
    );
  }

  // Host Disconnection Screen
  const hostPlayer = gameState.players.find(p => p.isHost);
  if (hostPlayer && !hostPlayer.isConnected) {
    return (
      <HostDisconnectionScreen 
        hostName={hostPlayer.name} 
        onLeaveRoom={() => {
          leaveRoom();
          navigate('/');
        }} 
      />
    );
  }

  // Game End Display
  if (gameState.gamePhase === 'finished') {
    return (
      <GameEndDisplay
        players={gameState.players}
        pabloCalled={gameState.pabloCalled}
        pabloCallerId={gameState.pabloCallerId}
        onResetGame={() => {
          console.log('GamePage: Resetting game...');
          executeAction({ type: 'resetGame' });
        }}
        isHost={currentPlayer?.isHost || false}
      />
    );
  }

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
    if (selectedCardIndex !== null && gameState?.lastAction?.type === 'draw' && currentPlayer?.id) {
      // Track the replaced card for highlighting
      setLastReplacedCard({ playerId: currentPlayer.id, cardIndex: selectedCardIndex });
      
      executeAction({ 
        type: 'replace', 
        playerId: currentPlayer.id,
        cardIndex: selectedCardIndex
      });
      setSelectedCardIndex(null);
      
      // Clear the replacement highlight after 3 seconds
      setTimeout(() => {
        setLastReplacedCard(null);
      }, 3000);
    }
  };

  const handleDiscardCard = () => {
    if (gameState?.lastAction?.type === 'draw' && currentPlayer?.id) {
      executeAction({ 
        type: 'discard', 
        playerId: currentPlayer.id
      });
    }
  };

  const handleCallPablo = () => {
    if (currentPlayer?.id) {
      executeAction({ type: 'callPablo', playerId: currentPlayer.id });
    }
  };

  const handleSkipPablo = () => {
    if (currentPlayer?.id) {
      executeAction({ type: 'pabloWindow', playerId: currentPlayer.id });
    }
  };

  const handlePeekCard = (cardIndex: number) => {
    if (currentPlayer?.id) {
      executeAction({ type: 'peekCard', playerId: currentPlayer.id, cardIndex });
    }
  };

  const handlePlayerReady = () => {
    if (currentPlayer?.id) {
      executeAction({ type: 'playerReady', playerId: currentPlayer.id });
    }
  };







  // Copy room code function
  const handleCopyRoomCode = async () => {
    // Use the room key (short code like "WEUKLY") instead of the room ID (UUID)
    const roomCode = gameState?.settings?.roomKey;
    if (!roomCode) {
      setToastMessage('❌ Room key not available');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    
    const inviteLink = `${window.location.origin}/join/${roomCode}`;
    console.log('GamePage: Copying invite link:', inviteLink);
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      
      // Provide multiple forms of feedback:
      // 1. Visual feedback (button state change)
      setLinkCopied(true);
      
      // 2. Haptic feedback (vibration if supported)
      if ('vibrate' in navigator) {
        navigator.vibrate(100); // Short vibration
      }
      
      // 3. Audio feedback suggestion (could be implemented later)
      // - Play a subtle "ding" sound
      // - Use Web Audio API for custom sounds
      
      // Reset state after 2 seconds for visual feedback
      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy room code:', err);
      setToastMessage('❌ Failed to copy invite link');
      setShowToast(true);
      
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
  };







  // Leave room function
  const handleLeaveRoom = async () => {
    try {
      console.log('GamePage: Leaving room...');
      
      // Always call leaveRoom to clear local state
      leaveRoom();
      
      // Force navigation to home
      console.log('GamePage: Room left successfully, navigating to home');
      navigate('/');
    } catch (error) {
      console.error('GamePage: Failed to leave room:', error);
      // Force navigation to home even if leaveRoom fails
      navigate('/');
    }
  };



  // Trick card handlers
  const handleExecuteSwap = () => {
    if (currentPlayer?.id && swapSourceCardIndex !== null && swapTargetPlayerId && swapTargetCardIndex !== null && gameState) {
      // Show the incoming card first
      const targetPlayer = gameState.players.find(p => p.id === swapTargetPlayerId);
      if (targetPlayer && targetPlayer.cards[swapTargetCardIndex]) {
        // Create a revealed version of the card for display
        const targetCard = targetPlayer.cards[swapTargetCardIndex];
        const revealedCard = {
          ...targetCard,
          suit: targetCard.suit === 'hidden' && targetCard.originalSuit ? targetCard.originalSuit : targetCard.suit,
          rank: (targetCard.rank as any) === 'hidden' && targetCard.originalRank ? targetCard.originalRank : targetCard.rank
        };
        setIncomingCard(revealedCard);
        setShowIncomingCard(true);
        
        // Execute swap after showing the card
        setTimeout(() => {
          const swapAction = {
            sourcePlayerId: currentPlayer.id,
            sourceCardIndex: swapSourceCardIndex,
            targetPlayerId: swapTargetPlayerId,
            targetCardIndex: swapTargetCardIndex
          };
          executeAction({ type: 'executeSwap', playerId: currentPlayer.id, swapAction });
          setShowIncomingCard(false);
          setIncomingCard(null);
        }, 2000);
      }
    }
  };

  const handleExecuteSpy = () => {
    if (currentPlayer?.id && spyTargetPlayerId && spyTargetCardIndex !== null && gameState) {
      // Show the spied card first
      const targetPlayer = gameState.players.find(p => p.id === spyTargetPlayerId);
      if (targetPlayer && targetPlayer.cards[spyTargetCardIndex]) {
        // Create a revealed version of the card for display
        const targetCard = targetPlayer.cards[spyTargetCardIndex];
        const revealedCard = {
          ...targetCard,
          suit: targetCard.suit === 'hidden' && targetCard.originalSuit ? targetCard.originalSuit : targetCard.suit,
          rank: (targetCard.rank as any) === 'hidden' && targetCard.originalRank ? targetCard.originalRank : targetCard.rank
        };
        setIncomingCard(revealedCard);
        setShowIncomingCard(true);
        
        // Execute spy after showing the card
        setTimeout(() => {
          const spyAction = {
            targetPlayerId: spyTargetPlayerId,
            targetCardIndex: spyTargetCardIndex
          };
          executeAction({ type: 'executeSpy', playerId: currentPlayer.id, spyAction });
          setShowIncomingCard(false);
          setIncomingCard(null);
        }, 2000);
      }
    }
  };

  const handleSkipTrick = () => {
    if (currentPlayer?.id) {
      executeAction({ type: 'skipTrick', playerId: currentPlayer.id });
    }
  };





  // Debug logging (only in development)
  if (import.meta.env.DEV) {
    // Add debug logging here when needed
  }



  // Main Game UI
  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Toast Notification */}
      <Toast show={showToast} message={toastMessage} />

      {/* Player Details */}
      <PlayerDetails
        roomId={roomId || ''}
        roomKey={gameState?.settings?.roomKey}
        currentPlayerName={currentPlayer?.name}
        onCopyRoomCode={handleCopyRoomCode}
        onLeaveRoom={handleLeaveRoom}
        linkCopied={linkCopied}
      />

      {/* Host Actions */}
      <HostActions
        isHost={currentPlayer?.isHost || false}
        gamePhase={gameState.gamePhase}
        playersCount={gameState.players.length}
        onStartRound={handleStartRound}
      />

      {/* Game Actions */}
      <GameActions
        gamePhase={gameState.gamePhase}
        isMyTurn={isMyTurn || false}
        canDraw={canDraw || false}
        canReplace={canReplace || false}
        canDiscard={canDiscard || false}
        canCallPablo={canCallPablo || false}

        pabloCallerName={pabloCaller?.name}
        isPabloWindow={isPabloWindow}
        pabloCountdown={pabloCountdown}
        isTrickActive={isTrickActive}
        isMyTrick={isMyTrick}
        activeTrick={activeTrick}
        lastAction={gameState.lastAction}
        selectedCardIndex={selectedCardIndex}
        swapSourceCardIndex={swapSourceCardIndex}
        swapTargetPlayerId={swapTargetPlayerId}
        swapTargetCardIndex={swapTargetCardIndex}
        spyTargetPlayerId={spyTargetPlayerId}
        spyTargetCardIndex={spyTargetCardIndex}
        playersCount={gameState.players.length}
        players={gameState.players}
        roundNumber={gameState.roundNumber}
        peekedCards={gameState.peekedCards || {}}
        readyPlayers={gameState.readyPlayers || []}
        currentPlayerId={currentPlayer?.id}
        currentPlayerIndex={gameState.currentPlayerIndex}
        onDrawFromStock={handleDrawFromStock}
        onDrawFromDiscard={handleDrawFromDiscard}
        onReplaceCard={handleReplaceCard}
        onDiscardCard={handleDiscardCard}
        onCallPablo={handleCallPablo}
        onSkipPablo={handleSkipPablo}
        onExecuteSwap={handleExecuteSwap}
        onExecuteSpy={handleExecuteSpy}
        onSkipTrick={handleSkipTrick}
        onPlayerReady={handlePlayerReady}
      />

      {/* Game Board */}
      <GameBoard
        stock={gameState.stock}
        discard={gameState.discard}
        players={gameState.players}
        currentPlayerIndex={gameState.currentPlayerIndex}
        currentPlayerId={currentPlayer?.id}
        selectedCardIndex={selectedCardIndex}
        canReplace={canReplace || false}
        lastReplacedCard={lastReplacedCard}
        isTrickActive={isTrickActive}
        isMyTrick={isMyTrick}
        activeTrick={activeTrick}
        swapSourceCardIndex={swapSourceCardIndex}
        swapTargetPlayerId={swapTargetPlayerId}
        swapTargetCardIndex={swapTargetCardIndex}
        spyTargetPlayerId={spyTargetPlayerId}
        spyTargetCardIndex={spyTargetCardIndex}
        gamePhase={gameState.gamePhase}
        peekedCards={gameState.peekedCards || {}}
        readyPlayers={gameState.readyPlayers || []}
        gameSettings={{
          cardsPerPlayer: gameState.settings.cardsPerPlayer,
          cardsGridColumns: gameState.settings.cardsGridColumns,
          cardsGridRows: gameState.settings.cardsGridRows
        }}
        roundNumber={gameState.roundNumber}
        pabloCalled={gameState.pabloCalled}
        pabloCallerId={gameState.pabloCallerId}
        isHost={currentPlayer?.isHost || false}
        onCardClick={(playerId, cardIndex) => {
          if (currentPlayer?.id === playerId && canReplace) {
            setSelectedCardIndex(cardIndex);
          } else if (isTrickActive && isMyTrick && activeTrick?.type === 'swap') {
            // Handle swap card selection
            if (currentPlayer?.id === playerId) {
              setSwapSourceCardIndex(cardIndex);
              setSwapTargetPlayerId(''); // Reset target selection
              setSwapTargetCardIndex(null);
            } else if (swapSourceCardIndex !== null) {
              // Set target player and card
              setSwapTargetPlayerId(playerId);
              setSwapTargetCardIndex(cardIndex);
            }
          } else if (isTrickActive && isMyTrick && activeTrick?.type === 'spy') {
            // Handle spy card selection
            setSpyTargetPlayerId(playerId);
            setSpyTargetCardIndex(cardIndex);
          }
        }}
        onPeekCard={handlePeekCard}
        onStartRound={handleStartRound}
      />



      {/* Incoming Card Display */}
      {showIncomingCard && incomingCard && (
        <TrickCardModal
          show={showIncomingCard}
          incomingCard={incomingCard}
          trickType={activeTrick?.type || undefined}
        />
      )}

      {/* Footer */}
      <GameFooter />
    </div>
  );
}
