import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';

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
          <div className="text-center text-sm text-gray-600">
            <p>Pablo Golf Game - A 4-card Golf variant</p>
            <p className="mt-1">Built for local hosting and multiplayer fun</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
