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
  const [settings, setSettings] = useState<RoomSettings>({
    ...DEFAULT_GAME_SETTINGS,
    roomKey: generateRoomKey(),
    maxPlayers: 5
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      console.log('Creating room with settings:', settings);
      
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
      await createRoom(settings, player);
      console.log('Room created successfully');
      
      // Navigate to the game page
      navigate(`/game/${settings.roomKey}`);
    } catch (error) {
      console.error('Room creation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create room');
    }
  };

  const updateSetting = <K extends keyof RoomSettings>(
    key: K, 
    value: RoomSettings[K]
  ) => {
    setSettings((prev: RoomSettings) => ({ ...prev, [key]: value }));
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

            {/* Deck & Values */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Deck & Values</h3>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Jokers Enabled</label>
                <input
                  type="checkbox"
                  checked={settings.jokersEnabled}
                  onChange={(e) => updateSetting('jokersEnabled', e.target.checked)}
                  className="w-4 h-4 text-primary-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Jack Value</label>
                  <input
                    type="number"
                    value={settings.faceCardValues.J}
                    onChange={(e) => updateSetting('faceCardValues', {
                      ...settings.faceCardValues,
                      J: parseInt(e.target.value) || 10
                    })}
                    className="input-field"
                    min="1"
                    max="20"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Queen Value</label>
                  <input
                    type="number"
                    value={settings.faceCardValues.Q}
                    onChange={(e) => updateSetting('faceCardValues', {
                      ...settings.faceCardValues,
                      Q: parseInt(e.target.value) || 10
                    })}
                    className="input-field"
                    min="1"
                    max="20"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">King Value</label>
                  <input
                    type="number"
                    value={settings.faceCardValues.K}
                    onChange={(e) => updateSetting('faceCardValues', {
                      ...settings.faceCardValues,
                      K: parseInt(e.target.value) || 10
                    })}
                    className="input-field"
                    min="1"
                    max="20"
                  />
                </div>
              </div>
            </div>



            {/* Table Rules */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Table Rules</h3>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Matching Rule</label>
                <input
                  type="checkbox"
                  checked={settings.matchingRule}
                  onChange={(e) => updateSetting('matchingRule', e.target.checked)}
                  className="w-4 h-4 text-primary-600"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Target Score to End Game
                </label>
                <input
                  type="number"
                  value={settings.targetScore}
                  onChange={(e) => updateSetting('targetScore', parseInt(e.target.value) || 100)}
                  className="input-field"
                  min="50"
                  max="200"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Reveal on Disconnect</label>
                <input
                  type="checkbox"
                  checked={settings.revealOnDisconnect}
                  onChange={(e) => updateSetting('revealOnDisconnect', e.target.checked)}
                  className="w-4 h-4 text-primary-600"
                />
              </div>
            </div>

            {/* Access */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Access</h3>
              
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Max Players
                </label>
                <select
                  value={settings.maxPlayers}
                  onChange={(e) => updateSetting('maxPlayers', parseInt(e.target.value))}
                  className="input-field"
                >
                  <option value={2}>2 Players</option>
                  <option value={3}>3 Players</option>
                  <option value={4}>4 Players</option>
                  <option value={5}>5 Players</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Join Password (Optional)
                </label>
                <input
                  type="text"
                  value={settings.joinPassword || ''}
                  onChange={(e) => updateSetting('joinPassword', e.target.value || undefined)}
                  className="input-field"
                  placeholder="Leave empty for no password"
                  maxLength={20}
                />
              </div>
            </div>

            {/* Persistence */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Persistence</h3>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Scoreboard Carryover</label>
                <input
                  type="checkbox"
                  checked={settings.scoreboardCarryover}
                  onChange={(e) => updateSetting('scoreboardCarryover', e.target.checked)}
                  className="w-4 h-4 text-primary-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Autosave Round State</label>
                <input
                  type="checkbox"
                  checked={settings.autosaveRoundState}
                  onChange={(e) => updateSetting('autosaveRoundState', e.target.checked)}
                  className="w-4 h-4 text-primary-600"
                />
              </div>
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
