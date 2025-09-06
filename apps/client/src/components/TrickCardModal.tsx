import { PlayingCard } from './PlayingCard';

interface TrickCardModalProps {
  show: boolean;
  incomingCard: any;
  trickType?: 'swap' | 'spy';
}

export function TrickCardModal({ show, incomingCard, trickType }: TrickCardModalProps) {
  if (!show || !incomingCard) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4 text-center">
          {trickType === 'spy' ? 'Spied Card' : 'Incoming Card'}
        </h3>
        <div className="text-center mb-4">
          <div className="flex justify-center">
            <div className={`p-2 rounded-lg ${
              trickType === 'spy' 
                ? 'bg-blue-100 border-2 border-blue-500' 
                : 'bg-red-100 border-2 border-red-500'
            }`}>
              <PlayingCard 
                card={incomingCard}
                isHidden={false}
                className="w-16 h-24"
              />
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
