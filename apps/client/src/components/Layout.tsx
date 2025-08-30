import { ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { MusicControl } from './MusicControl';
import { LogOut, HelpCircle } from 'lucide-react';
import { GameInstructions } from './GameInstructions';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, leaveRoom } = useGameStore();
  const [showInstructions, setShowInstructions] = useState(false);

  const isInGame = location.pathname.startsWith('/game');

  const handleLeaveRoom = () => {
    console.log('Layout: Leaving room...');
    // Always call leaveRoom to clear local state
    leaveRoom();
    // Force navigation to home
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <div className="flex items-center">
                          <h1 className="text-xl font-bold text-gray-900">
              Pablo! ♠
            </h1>
              {isConnected && (
                <div className="ml-4 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              {/* How to Play Button */}
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="How to Play Pablo"
              >
                <HelpCircle size={16} />
              </button>
              
              {isInGame && (
                <button
                  onClick={handleLeaveRoom}
                  className="flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  title="Leave the current game room"
                >
                  <LogOut size={16} />
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">🎮 How to Play Pablo</h2>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <GameInstructions />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-yellow-800">💡</span>
              </div>
              <span className="text-base font-semibold text-gray-700">Play Pablo and have fun!</span>
            </div>
            <p className="text-xs text-gray-600">
              for support contact: <a href="mailto:katiyarswapnil@gmail.com" className="text-blue-600 hover:text-blue-800 underline">katiyarswapnil@gmail.com</a>
            </p>
          </div>
        </div>
      </footer>

      {/* Music Control */}
      <MusicControl />
    </div>
  );
}
