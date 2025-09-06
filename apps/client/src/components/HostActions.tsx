import { Play } from 'lucide-react';

interface HostActionsProps {
  isHost: boolean;
  gamePhase: string;
  playersCount: number;
  onStartRound: () => void;
}

export function HostActions({
  isHost,
  gamePhase,
  playersCount,
  onStartRound
}: HostActionsProps) {
  if (!isHost) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center space-x-3 mb-3">
        <h2 className="text-lg font-semibold">Host Actions</h2>
        {gamePhase === 'waiting' && playersCount < 2 && (
          <span className="text-xs text-yellow-800">
            ⚠️ Need at least 2 players to start the game
          </span>
        )}
      </div>
      
      {gamePhase === 'waiting' && (
        <div className="flex justify-start">
          <button
            onClick={onStartRound}
            disabled={playersCount < 2}
            className="flex items-center justify-center space-x-1 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            <Play size={16} />
            <span>Start Round</span>
          </button>
        </div>
      )}

      {gamePhase === 'roundEnd' && (
        <div className="flex justify-start">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Ready to start the next round?</p>
            <button
              onClick={onStartRound}
              className="flex items-center justify-center space-x-1 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors whitespace-nowrap"
            >
              <Play size={16} />
              <span>Start Next Round</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
