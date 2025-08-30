import { Share2, Trophy, LogOut, Volume2 } from 'lucide-react';

interface GameHeaderProps {
  roomId: string;
  roomKey?: string;
  currentPlayerName?: string;
  gamePhase: string;
  roundNumber: number;
  isFinalRound: boolean;
  pabloCallerName?: string;
  isHost: boolean;
  onCopyRoomCode: () => void;
  onLeaveRoom: () => void;
  onEndGame: () => void;
  linkCopied?: boolean;
}

export function GameHeader({
  roomId,
  roomKey,
  currentPlayerName,
  gamePhase,
  roundNumber,
  isFinalRound,
  pabloCallerName,
  isHost,
  onCopyRoomCode,
  onLeaveRoom,
  onEndGame,
  linkCopied
}: GameHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center justify-between">
        {/* Left: Game Name */}
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <span>Pablo!</span>
            <span className="text-3xl">♠</span>
          </h1>
        </div>
        
        {/* Center: Room Code and Share */}
        <div className="flex items-center space-x-4">
          <span className="text-lg font-semibold text-gray-700">
            Room: {roomKey || roomId}
          </span>
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
        
        {/* Right: Leave Room Button */}
        <div className="flex items-center">
          <button
            onClick={onLeaveRoom}
            className="flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            title="Leave the game room"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
      
      {/* Player Name - Below the main header */}
      {currentPlayerName && (
        <div className="mt-3 text-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Playing as: {currentPlayerName}
          </h3>
        </div>
      )}
      
      {/* Game Status - Below player name */}
      <div className="mt-3 text-center">
        <p className="text-gray-600">
          Phase: {gamePhase} | Round: {roundNumber}
          {isFinalRound && pabloCallerName && (
            <span className="ml-2 inline-flex items-center">
              <span className="text-red-600 font-semibold mr-2">🚨 FINAL ROUND</span>
              <div className="relative group">
                <Volume2 
                  size={20} 
                  className="text-blue-600 hover:text-blue-700 transition-colors cursor-help" 
                />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {pabloCallerName} called Pablo!
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              </div>
            </span>
          )}
        </p>
      </div>
      
      {/* Host Controls - Below game status */}
      {isHost && (
        <div className="mt-3 text-center">
          <button
            onClick={onEndGame}
            className="flex items-center justify-center w-10 h-10 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            title="End the game immediately (Host only)"
          >
            <Trophy size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
