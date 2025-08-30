import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { JoinRoomModal } from '../components/JoinRoomModal';
import { ErrorMessage } from '../components/ErrorMessage';

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    connect,
    isConnected,
    roomId,
    error,
    showCreateRoomModal,
    showJoinRoomModal,
    showCreateRoom,
    showJoinRoom,
    setError
  } = useGameStore();

  // Check for connection error from navigation state
  const connectionError = location.state?.error;

  // Connect to server on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Navigate to game if we have a room
  useEffect(() => {
    if (roomId) {
      navigate(`/game/${roomId}`);
    }
  }, [roomId, navigate]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Pablo Golf
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          A 4-card Golf variant with multiplayer support
        </p>
        
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-yellow-800">
              Connecting to server...
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <ErrorMessage 
          message={error} 
          onClose={() => setError(null)} 
        />
      )}

      {/* Connection Error Display */}
      {connectionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Connection Lost
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {connectionError}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => navigate('/', { replace: true, state: {} })}
                className="text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Options */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Create Room */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Create a Room
          </h2>
          <p className="text-gray-600 mb-6">
            Host a new game and invite friends to join. Customize game rules and settings.
          </p>
          <button
            onClick={showCreateRoom}
            disabled={!isConnected}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Room
          </button>
        </div>

        {/* Join Room */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Join a Room
          </h2>
          <p className="text-gray-600 mb-6">
            Enter a room key to join an existing game. You'll need the key from the host.
          </p>
          <button
            onClick={showJoinRoom}
            disabled={!isConnected}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Room
          </button>
        </div>
      </div>

      {/* Game Rules */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          How to Play
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Objective</h3>
            <p className="text-gray-600">
              Get the lowest score by collecting cards with the lowest values. 
              Aces = 1, Number cards = face value, Face cards = 10, Jokers = -5.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Gameplay</h3>
            <p className="text-gray-600">
              Each player has 4 cards in a 2×2 grid. Draw from stock or discard, 
              then replace one of your cards. Call "Pablo" when you think you have the lowest score.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Scoring</h3>
            <p className="text-gray-600">
              Sum your card values. If Pablo caller has lowest score, they get -10 bonus. 
              If not, they add penalty equal to the highest score. Game ends when someone reaches 100.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Special Trick Cards</h3>
            <p className="text-gray-600">
              <strong>Card 7 (Swap):</strong> Swap one of your cards with any card from another player's area. 
              You can look at the incoming card before placing it.<br/><br/>
              <strong>Card 8 (Spy):</strong> Look at any card in your own or another player's area, then put it back immediately.
            </p>
          </div>
        </div>
      </div>

             {/* Modals */}
       {showCreateRoomModal && <CreateRoomModal />}
       {showJoinRoomModal && <JoinRoomModal />}
       

     </div>
   );
 }

