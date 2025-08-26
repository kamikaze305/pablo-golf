import { useState } from 'react';
import { X } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { Player } from '@pablo/engine';

export function JoinRoomModal() {
  const { hideJoinRoom, joinRoom, isLoading, setError } = useGameStore();
  
  const [playerName, setPlayerName] = useState('');
  const [roomKey, setRoomKey] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomKey.trim()) {
      setError('Please enter the room key');
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

      await joinRoom(roomKey.trim().toUpperCase(), player, password || undefined);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join room');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Join Room</h2>
            <button
              onClick={hideJoinRoom}
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

            {/* Room Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Key
              </label>
              <input
                type="text"
                value={roomKey}
                onChange={(e) => setRoomKey(e.target.value.toUpperCase())}
                className="input-field font-mono"
                placeholder="Enter room key (e.g., ABC123)"
                maxLength={10}
              />
              <p className="text-sm text-gray-500 mt-1">
                Get this from the person who created the room
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password (if required)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter password if required"
                maxLength={20}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={hideJoinRoom}
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
                {isLoading ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

