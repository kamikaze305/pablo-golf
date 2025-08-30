import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { MusicControl } from './MusicControl';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { isConnected, leaveRoom } = useGameStore();

  const isInGame = location.pathname.startsWith('/game');
  const isQAPage = location.pathname === '/qa';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Pablo Golf
              </h1>
              {isConnected && (
                <div className="ml-4 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Connected</span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              {isInGame && (
                <button
                  onClick={leaveRoom}
                  className="btn-secondary text-sm"
                >
                  Leave Game
                </button>
              )}

              {!isQAPage && (
                <a
                  href="/qa"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  QA
                </a>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-yellow-800">💡</span>
              </div>
              <span className="text-lg font-semibold text-gray-700">Play Pablo and have fun!</span>
            </div>
            <p className="text-sm text-gray-600">
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
