import { Music, VolumeX } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';

export function MusicControl() {
  const { toggleMusic, isPlaying, musicStatus } = useMusic();

  const handleMusicToggle = async () => {
    if (musicStatus === 'loading') return;
    await toggleMusic();
  };

  const getStatusColor = () => {
    if (musicStatus === 'loading') return 'bg-yellow-500';
    if (musicStatus === 'error') return 'bg-red-500';
    return isPlaying ? 'bg-blue-600' : 'bg-gray-500';
  };

  const getStatusTitle = () => {
    if (musicStatus === 'loading') return 'Loading Music...';
    if (musicStatus === 'error') return 'Music Error - Click to Retry';
    return isPlaying ? 'Click to Mute Music' : 'Click to Unmute Music';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200">
        <button
          onClick={handleMusicToggle}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${getStatusColor()} text-white hover:opacity-80`}
          title={getStatusTitle()}
          disabled={musicStatus === 'loading'}
        >
          {isPlaying ? <Music size={20} /> : <VolumeX size={20} />}
        </button>
      </div>
    </div>
  );
}
