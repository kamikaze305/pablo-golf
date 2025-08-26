import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';

export function MusicControl() {
  const { isPlaying, toggleMusic, volume, setVolume } = useMusic();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const audioAvailable = true; // For now, we'll assume audio is available

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200">
        {/* Music Toggle Button */}
        <button
          onClick={toggleMusic}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
            audioAvailable 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-400 cursor-not-allowed text-gray-200'
          }`}
          title={audioAvailable ? (isPlaying ? 'Pause Music' : 'Play Music') : 'Music not available'}
          disabled={!audioAvailable}
        >
          {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

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
