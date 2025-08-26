import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface MusicContextType {
  isPlaying: boolean;
  toggleMusic: () => void;
  volume: number;
  setVolume: (volume: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element with error handling
    try {
      audioRef.current = new Audio('/music/bg_music.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = volume;

      // Add error handling for audio loading
      audioRef.current.addEventListener('error', (e) => {
        console.warn('Failed to load audio file:', e);
        audioRef.current = null;
      });

      // Load saved music state from localStorage
      const savedMusicState = localStorage.getItem('pablo_music_state');
      if (savedMusicState) {
        const { isPlaying: savedIsPlaying, volume: savedVolume } = JSON.parse(savedMusicState);
        setIsPlaying(savedIsPlaying);
        setVolume(savedVolume);
        if (savedIsPlaying && audioRef.current) {
          audioRef.current.play().catch((error) => {
            console.warn('Failed to play audio:', error);
            setIsPlaying(false);
          });
        }
      }
    } catch (error) {
      console.warn('Failed to initialize audio:', error);
      audioRef.current = null;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggleMusic = () => {
    if (!audioRef.current) {
      console.warn('Audio not available');
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((error) => {
        console.warn('Failed to play audio:', error);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }

    // Save state to localStorage
    localStorage.setItem('pablo_music_state', JSON.stringify({
      isPlaying: !isPlaying,
      volume
    }));
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    localStorage.setItem('pablo_music_state', JSON.stringify({
      isPlaying,
      volume: newVolume
    }));
  };

  return (
    <MusicContext.Provider value={{
      isPlaying,
      toggleMusic,
      volume,
      setVolume: handleVolumeChange
    }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
