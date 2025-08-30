import { useState } from 'react';
import { Volume2, VolumeX, Loader2, Play, Pause } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';

export function MusicControl() {
  const { toggleMusic, volume, setVolume, ensureMusicPlaying, musicStatus } = useMusic();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const handleMusicToggle = async () => {
    if (musicStatus === 'loading') return;
    
    if (musicStatus === 'error') {
      // Try to reload music if there was an error
      await ensureMusicPlaying();
      return;
    }
    
    await toggleMusic();
  };

  const getStatusColor = () => {
    switch (musicStatus) {
      case 'loading': return 'bg-yellow-500';
      case 'ready': return 'bg-green-500';
      case 'playing': return 'bg-blue-600';
      case 'paused': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (musicStatus) {
      case 'loading': return <Loader2 size={20} className="animate-spin" />;
      case 'ready': return <Play size={20} />;
      case 'playing': return <Pause size={20} />;
      case 'paused': return <Play size={20} />;
      case 'error': return <VolumeX size={20} />;
      default: return <VolumeX size={20} />;
    }
  };

  const getStatusTitle = () => {
    switch (musicStatus) {
      case 'loading': return 'Loading Music...';
      case 'ready': return 'Click to Play Music';
      case 'playing': return 'Click to Pause Music';
      case 'paused': return 'Click to Resume Music';
      case 'error': return 'Music Error - Click to Retry';
      default: return 'Music Control';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200">
        {/* Music Toggle Button */}
        <button
          onClick={handleMusicToggle}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${getStatusColor()} text-white hover:opacity-80`}
          title={getStatusTitle()}
          disabled={musicStatus === 'loading'}
        >
          {getStatusIcon()}
        </button>

        {/* Status Indicator */}
        <div className="mt-2 text-xs text-center">
          <div className={`inline-block px-2 py-1 rounded-full text-white ${getStatusColor()}`}>
            {musicStatus}
          </div>
        </div>

        {/* Volume Slider */}
        {showVolumeSlider && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <VolumeX size={16} className="text-gray-500" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, #e5e7eb ${volume * 100}%, #e5e7eb 100%)`
                }}
                title="Volume"
              />
              <Volume2 size={16} className="text-gray-500" />
            </div>
            <div className="text-xs text-gray-500 text-center mt-1">
              {Math.round(volume * 100)}%
            </div>
          </div>
        )}

        {/* Volume Toggle Button */}
        <button
          onClick={() => setShowVolumeSlider(!showVolumeSlider)}
          className="mt-2 w-full text-xs text-gray-600 hover:text-gray-800 transition-colors"
          title="Volume Control"
        >
          {showVolumeSlider ? 'Hide' : 'Volume'}
        </button>
      </div>
    </div>
  );
}
