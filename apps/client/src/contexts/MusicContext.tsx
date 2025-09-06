import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

interface MusicContextType {
  isPlaying: boolean;
  toggleMusic: () => void;
  ensureMusicPlaying: () => Promise<void>;
  musicStatus: 'loading' | 'ready' | 'playing' | 'paused' | 'error';
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicStatus, setMusicStatus] = useState<'loading' | 'ready' | 'playing' | 'paused' | 'error'>('paused');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Fetch and load the music file
    const loadMusic = async () => {
      try {
        setMusicStatus('loading');
        
        // Load music from the main path
        const musicPath = '/music/bg_music.mp3';
        
        console.log('Attempting to fetch music from:', musicPath);
        
        const response = await fetch(musicPath);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch music from ${musicPath}: ${response.status}`);
        }
        
        const audioBlob = await response.blob();
        console.log('Successfully fetched music from:', musicPath);
        
        // Create audio element from the blob
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current = new Audio(audioUrl);
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
        audioRef.current.preload = 'auto';

        // Wait for audio to be loaded before allowing playback
        audioRef.current.addEventListener('canplaythrough', async () => {
          setMusicStatus('ready');
          console.log('Audio loaded successfully from:', musicPath);
          
          // Don't auto-play music - start in muted state
          setMusicStatus('paused');
          setIsPlaying(false);
          console.log('Music loaded and ready, but muted by default');
        });

        // Add error handling for audio loading
        audioRef.current.addEventListener('error', (e) => {
          console.warn('Failed to load audio after fetch:', e);
          setMusicStatus('error');
          audioRef.current = null;
        });

        // Load saved music state from localStorage, default to muted
        const savedMusicState = localStorage.getItem('pablo_music_state');
        if (savedMusicState) {
          try {
            const { isPlaying: savedIsPlaying } = JSON.parse(savedMusicState);
            setIsPlaying(savedIsPlaying);
            if (savedIsPlaying) {
              setMusicStatus('playing');
            }
          } catch (error) {
            console.warn('Failed to parse saved music state, defaulting to muted');
            setIsPlaying(false);
            setMusicStatus('paused');
          }
        } else {
          // Default to muted state
          setIsPlaying(false);
          setMusicStatus('paused');
        }
        
      } catch (error) {
        console.error('Failed to load music:', error);
        setMusicStatus('error');
        audioRef.current = null;
      }
    };

    loadMusic();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        // Clean up the blob URL
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current = null;
      }
    };
  }, []);



  // Ensure music continues playing during game actions
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && audioRef.current && isPlaying && musicStatus === 'playing') {
        // Resume music when tab becomes visible again
        audioRef.current.play().catch(error => {
          console.warn('Failed to resume music on visibility change:', error);
        });
      }
    };

    const handleFocus = () => {
      if (audioRef.current && isPlaying && musicStatus === 'playing') {
        // Resume music when window gains focus
        audioRef.current.play().catch(error => {
          console.warn('Failed to resume music on focus:', error);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isPlaying, musicStatus]);

  const toggleMusic = async () => {
    if (!audioRef.current) {
      console.warn('Audio not available');
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        setMusicStatus('paused');
      } else {
        // Ensure audio context is resumed (required for autoplay policies)
        if (audioRef.current.readyState >= 2) { // HAVE_CURRENT_DATA
          await audioRef.current.play();
          setIsPlaying(true);
          setMusicStatus('playing');
        } else {
          console.warn('Audio not ready to play');
          return;
        }
      }

      // Save state to localStorage
      localStorage.setItem('pablo_music_state', JSON.stringify({
        isPlaying: !isPlaying
      }));
    } catch (error) {
      console.warn('Failed to toggle audio:', error);
      setIsPlaying(false);
      setMusicStatus('error');
    }
  };

  const ensureMusicPlaying = async () => {
    if (!audioRef.current || musicStatus === 'error') {
      console.warn('Cannot ensure music playing - audio not available');
      return;
    }

    if (!isPlaying && musicStatus === 'ready') {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setMusicStatus('playing');
        console.log('Music resumed by ensureMusicPlaying');
      } catch (error) {
        console.warn('Failed to resume music:', error);
      }
    }
  };

  return (
    <MusicContext.Provider value={{
      isPlaying,
      toggleMusic,
      ensureMusicPlaying,
      musicStatus
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

// Custom hook for ensuring music continues during game actions
export function useGameMusic() {
  const { ensureMusicPlaying, musicStatus, isPlaying } = useMusic();

  const ensureMusicDuringAction = useCallback(async (actionName: string) => {
    console.log(`Ensuring music continues during game action: ${actionName}`);
    
    if (musicStatus === 'ready' && !isPlaying) {
      await ensureMusicPlaying();
    }
    
    // Log music status for debugging
    console.log(`Music status during ${actionName}:`, { musicStatus, isPlaying });
  }, [ensureMusicPlaying, musicStatus, isPlaying]);

  return {
    ensureMusicDuringAction,
    musicStatus,
    isPlaying
  };
}
