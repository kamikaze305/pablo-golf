interface TrickCardModalProps {
  show: boolean;
  incomingCard: any;
  trickType?: 'swap' | 'spy';
}

// Helper function to format card display names with proper suit symbols
const formatCardDisplay = (card: any): string => {
  if (!card) return 'Empty';
  if (card.isJoker) return `JOKER (${card.value})`;
  
  const suitSymbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  
  const suitSymbol = suitSymbols[card.suit as keyof typeof suitSymbols] || card.suit;
  return `${card.rank} ${suitSymbol} (${card.value})`;
};

export function TrickCardModal({ show, incomingCard, trickType }: TrickCardModalProps) {
  if (!show || !incomingCard) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4 text-center">
          {trickType === 'spy' ? 'Spied Card' : 'Incoming Card'}
        </h3>
        <div className="text-center mb-4">
          <div className={`inline-block rounded-lg p-4 ${
            trickType === 'spy' 
              ? 'bg-blue-100 border-2 border-blue-500' 
              : 'bg-red-100 border-2 border-red-500'
          }`}>
            <div className={`font-bold text-xl ${
              trickType === 'spy' ? 'text-blue-600' : 'text-red-600'
            }`}>
              {formatCardDisplay(incomingCard)}
            </div>
          </div>
        </div>
        <p className="text-center text-gray-600">
          {trickType === 'spy' 
            ? 'You spied on this card. It will be hidden in 2 seconds...' 
            : 'This card will be swapped in 2 seconds...'}
        </p>
      </div>
    </div>
  );
}
