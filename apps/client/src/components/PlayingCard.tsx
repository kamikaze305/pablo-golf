

interface CardProps {
  card: {
    rank: string;
    suit: string;
    value: number;
    isJoker: boolean;
  } | null;
  isHidden?: boolean | null;
  isSelected?: boolean | null;
  isPeekable?: boolean | null;
  onClick?: () => void;
  className?: string;
}

// Suit icons mapping
const suitIcons = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

// Suit colors
const suitColors = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-black',
  spades: 'text-black'
};

export function PlayingCard({ 
  card, 
  isHidden = false, 
  isSelected = false, 
  isPeekable = false, 
  onClick,
  className = ''
}: CardProps) {
  const baseClasses = "w-12 h-16 border rounded flex flex-col justify-between relative cursor-pointer transition-all text-xs";
  
  const cardClasses = `
    ${baseClasses}
    ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : ''}
    ${isHidden ? 'border-gray-400 bg-gradient-to-br from-red-200 to-red-300' : 'border-gray-300 bg-white'}
    ${onClick ? 'hover:border-blue-400 hover:bg-blue-50' : ''}
    ${className}
  `;

  if (isHidden === true || (card && card.suit === 'hidden' && card.rank === 'hidden')) {
    return (
      <div className={cardClasses} onClick={onClick}>
        {/* Card Back Design - CSS only */}
        <div className="w-full h-full bg-gradient-to-br from-red-200 to-red-300 relative">
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'}}></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-2xl font-bold opacity-80">♠</div>
          </div>
          <div className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 border-white opacity-60"></div>
          <div className="absolute top-1 right-1 w-3 h-3 border-r-2 border-t-2 border-white opacity-60"></div>
          <div className="absolute bottom-1 left-1 w-3 h-3 border-l-2 border-b-2 border-white opacity-60"></div>
          <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-white opacity-60"></div>
        </div>
        
        {/* Overlay indicators */}
        {isPeekable === true && (
          <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-800 text-xs px-1 rounded-full z-10">
            Peek
          </div>
        )}
      </div>
    );
  }

  if (!card) {
    return (
      <div className={`${baseClasses} bg-gray-100 border-gray-300 border-dashed ${className}`}>
        {/* Empty slot - visible with dashed border and "Empty" text */}
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <div className="text-xs font-medium">Empty</div>
          </div>
        </div>
      </div>
    );
  }

  // Handle joker cards - but respect isHidden prop
  if (card.isJoker && !isHidden) {
    return (
      <div className={cardClasses} onClick={onClick}>
        {/* Joker card - show joker emoji in center */}
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-purple-600">
            <div className="text-lg">🃏</div>
            <div className="text-xs font-bold">JOKER</div>
          </div>
        </div>
      </div>
    );
  }

  const suitIcon = suitIcons[card.suit as keyof typeof suitIcons] || card.suit;
  const suitColor = suitColors[card.suit as keyof typeof suitColors] || 'text-black';

  return (
    <div className={cardClasses} onClick={onClick}>
      {/* Top left corner - suit icon only */}
      <div className={`absolute top-1 left-1 text-xs font-bold ${suitColor}`}>
        {suitIcon}
      </div>
      
      {/* Bottom right corner - suit icon only */}
      <div className={`absolute bottom-1 right-1 text-xs font-bold ${suitColor}`}>
        {suitIcon}
      </div>
      
      {/* Center content - rank only */}
      <div className="flex items-center justify-center h-full">
        <div className={`text-center ${suitColor}`}>
          <div className="font-bold text-sm">{card.rank}</div>
        </div>
      </div>
      
      {/* Overlay indicators */}
    </div>
  );
}
