import { Share2 } from 'lucide-react';

interface PlayerDetailsProps {
  roomId: string;
  roomKey?: string;
  currentPlayerName?: string;
  targetScore?: number;
  onCopyRoomCode: () => void;
  onLeaveRoom: () => void;
  linkCopied: boolean;
}

export function PlayerDetails({
  roomId,
  roomKey,
  currentPlayerName,
  targetScore = 50,
  onCopyRoomCode,
  linkCopied
}: PlayerDetailsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-lg font-semibold text-gray-700">
            Room: {roomKey || roomId}
          </span>
          
          {/* Cutoff Score Display */}
          <div className="flex items-center space-x-1 bg-gradient-to-r from-purple-50 to-blue-50 px-2 py-1 rounded-md border border-purple-200">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            <span className="text-xs font-medium text-purple-700">Cutoff:</span>
            <span className="text-sm font-bold text-purple-800">{targetScore}</span>
          </div>
          
          <div className="flex flex-col items-center">
            <button
              onClick={onCopyRoomCode}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 ease-in-out ${
                linkCopied 
                  ? 'bg-green-600 text-white scale-110 shadow-lg animate-bounce ring-2 ring-green-400 ring-opacity-75' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
              }`}
              title={linkCopied ? "Link copied!" : "Copy invite link"}
            >
              {linkCopied ? (
                <span className="text-xs font-bold">✓</span>
              ) : (
                <Share2 size={16} />
              )}
            </button>
            {linkCopied && (
              <span className="text-xs text-green-600 font-medium mt-1 animate-pulse">
                Copied!
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">👤</span>
            </div>
            <span className="text-lg font-semibold text-gray-800">
              {currentPlayerName || 'Player'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
