import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { Player } from '@pablo/engine';

export function JoinRoomPage() {
  const { roomKey } = useParams();
  const navigate = useNavigate();
  const { joinRoom, isLoading, error, setError, isConnected, connect } = useGameStore();
  
  const [playerName, setPlayerName] = useState('');
  
  // Add ref for auto-focus
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on name input when page loads
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  // Auto-connect when component mounts
  useEffect(() => {
    if (!isConnected) {
      connect();
    }
  }, [isConnected, connect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomKey) {
      setError('Invalid room key');
      return;
    }

    try {
      const player: Player = {
        id: crypto.randomUUID(),
        name: playerName.trim(),
        cards: [],
        isConnected: true,
        totalScore: 0,
        roundScore: 0,
        isHost: false
      };

      await joinRoom(roomKey.toUpperCase(), player);
      
      // Navigate to the game page after successful join
      // The roomId will be available in the store after successful join
      const { roomId } = useGameStore.getState();
      if (roomId) {
        navigate(`/game/${roomId}`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join room');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Room</h1>
          <p className="text-gray-600">Enter your details to join the game</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Key Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Key
            </label>
            <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-center text-lg font-bold text-gray-900">
              {roomKey?.toUpperCase()}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              You're joining this specific room
            </p>
          </div>

          {/* Player Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your name"
              maxLength={20}
              required
            />
          </div>



          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isConnected}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {isLoading ? 'Joining...' : 'Join Room'}
          </button>
        </form>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
