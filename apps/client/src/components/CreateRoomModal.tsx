import { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { RoomSettings, Player, DEFAULT_GAME_SETTINGS } from '@pablo/engine';

function generateRoomKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function CreateRoomModal() {
  const { hideCreateRoom, createRoom, isLoading, setError } = useGameStore();
  const navigate = useNavigate();
  
  const [playerName, setPlayerName] = useState('');
  const [targetScore, setTargetScore] = useState(50);
  const [settings] = useState<RoomSettings>({
    ...DEFAULT_GAME_SETTINGS,
    roomKey: generateRoomKey(),
    targetScore: 50
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      // Update settings with the form values
      const finalSettings = {
        ...settings,
        targetScore
      };
      
      console.log('Creating room with settings:', finalSettings);
      
      const player: Player = {
        id: crypto.randomUUID(),
        name: playerName.trim(),
        cards: [],
        isConnected: true,
        totalScore: 0,
        roundScore: 0,
        isHost: true
      };

      console.log('Creating room with player:', player);
      await createRoom(finalSettings, player);
      console.log('Room created successfully');
      
      // Navigate to the game page
      navigate(`/game/${finalSettings.roomKey}`);
    } catch (error) {
      console.error('Room creation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create room');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Room</h2>
            <button
              onClick={hideCreateRoom}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Player Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="input-field"
                placeholder="Enter your name"
                maxLength={20}
              />
            </div>

            {/* Target Score */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Target Score to End Game
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[30, 50, 75, 100].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setTargetScore(score)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      targetScore === score
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Game ends when one of the players reach this score.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={hideCreateRoom}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
