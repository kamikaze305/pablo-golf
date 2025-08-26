import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { JoinRoomModal } from '../components/JoinRoomModal';
import { ErrorMessage } from '../components/ErrorMessage';

export function HomePage() {
  const navigate = useNavigate();
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Power Cards</h3>
            <p className="text-gray-600">
              7 = Swap cards with any opponent. 8 = Spy peek at any card. 
              Only usable if drawn from stock and immediately discarded.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Scoring</h3>
            <p className="text-gray-600">
              Sum your card values. If Pablo caller has lowest score, they get -10 bonus. 
              If not, they add penalty equal to the highest score. Game ends when someone reaches 100.
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

