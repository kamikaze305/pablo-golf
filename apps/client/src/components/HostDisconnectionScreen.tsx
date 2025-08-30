interface HostDisconnectionScreenProps {
  hostName: string;
  onLeaveRoom: () => void;
}

export function HostDisconnectionScreen({ hostName, onLeaveRoom }: HostDisconnectionScreenProps) {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-md p-6 text-center">
        <div className="text-6xl mb-4">👋</div>
        <h1 className="text-2xl font-bold text-red-800 mb-4">Host Closed the Game</h1>
        <p className="text-red-700 mb-6">
          The host ({hostName}) has left the game. The game has ended.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 font-medium">
            Redirecting to landing page in 10 seconds...
          </p>
          <p className="text-blue-700 text-sm mt-2">
            Create or join a room to start playing again
          </p>
        </div>
        <button
          onClick={onLeaveRoom}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Go to Landing Page Now
        </button>
      </div>
    </div>
  );
}
