import { Play, Megaphone } from 'lucide-react';
import { PlayingCard } from './PlayingCard';
import { HostIcon } from './icons_master';

interface RoundEndDisplayProps {
  roundNumber: number;
  players: any[];
  pabloCalled: boolean;
  pabloCallerId?: string;
  isHost: boolean;
  onStartRound: () => void;
}

export function RoundEndDisplay({
  roundNumber,
  players,
  pabloCalled,
  pabloCallerId,
  isHost,
  onStartRound
}: RoundEndDisplayProps) {
  return (
    <div className="w-full">
      {/* Round Completion Header */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Round {roundNumber} Complete!</h3>
        <div className="text-sm text-gray-600 mb-3">
          {isHost ? (
            <div className="space-y-2">
              <p>Ready to start the next round?</p>
              <button
                onClick={onStartRound}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
              >
                <Play size={14} className="inline mr-2" />
                Start Next Round
              </button>
            </div>
          ) : (
            <p>Waiting for host to start next round...</p>
          )}
        </div>
      </div>

      {/* Round Results - Compact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {players.map((player) => (
          <div key={player.id} className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <div className="flex items-center space-x-2">
                  {player.isHost && <HostIcon />}
                  <h4 className="font-semibold text-sm">
                    {player.name}
                  </h4>
                </div>
                {pabloCalled && pabloCallerId === player.id && (
                  <div className="relative group">
                                         <Megaphone 
                       size={14} 
                       className="text-yellow-600 cursor-help" 
                     />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      Called Pablo
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right text-xs">
                <div className="text-gray-600">Round</div>
                <div className={`font-bold ${player.roundScore > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {player.roundScore > 0 ? '+' : ''}{player.roundScore}
                </div>
                <div className="text-gray-600">Total</div>
                <div className="font-bold text-blue-600">{player.totalScore}</div>
              </div>
            </div>
            
            {/* Show all cards - Compact */}
            <div className="grid grid-cols-2 grid-rows-2 gap-1 max-w-[120px] mx-auto mb-2">
              {player.cards.map((card: any, cardIndex: number) => (
                <PlayingCard
                  key={cardIndex}
                  card={card}
                  className="scale-75"
                />
              ))}
            </div>
            
            {/* Card Total - Raw sum of card values only */}
            <div className="text-center text-xs text-gray-600">
              <div className="font-medium">
                Card Total: {player.cards.reduce((sum: number, card: any) => sum + (card ? card.value : 0), 0)}
              </div>
            </div>
          </div>
        ))}
      </div>


    </div>
  );
}
