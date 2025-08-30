import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

interface MusicContextType {
  isPlaying: boolean;
  toggleMusic: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  ensureMusicPlaying: () => Promise<void>;
  musicStatus: 'loading' | 'ready' | 'playing' | 'paused' | 'error';
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [musicStatus, setMusicStatus] = useState<'loading' | 'ready' | 'playing' | 'paused' | 'error'>('loading');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Fetch and load the music file
    const loadMusic = async () => {
      try {
        setMusicStatus('loading');
        
        // Try multiple paths to find the music file
        const musicPaths = [
          '/music/bg_music.mp3',
          '/resources/music/bg_music.mp3',
          './music/bg_music.mp3',
          '../music/bg_music.mp3'
        ];
        
        console.log('Attempting to fetch music from paths:', musicPaths);
        
        let audioBlob: Blob | null = null;
        let successfulPath = '';
        
        // Try each path until one works
        for (const path of musicPaths) {
          try {
            console.log('Trying to fetch from:', path);
            const response = await fetch(path);
            
            if (response.ok) {
              audioBlob = await response.blob();
              successfulPath = path;
              console.log('Successfully fetched music from:', path);
              break;
            } else {
              console.warn('Failed to fetch from:', path, 'Status:', response.status);
            }
          } catch (error) {
            console.warn('Error fetching from:', path, error);
          }
        }
        
        if (!audioBlob) {
          throw new Error('Failed to fetch music from all paths');
        }
        
        // Create audio element from the blob
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current = new Audio(audioUrl);
        audioRef.current.loop = true;
        audioRef.current.volume = volume;
        audioRef.current.preload = 'auto';

        // Wait for audio to be loaded before allowing playback
        audioRef.current.addEventListener('canplaythrough', async () => {
          setMusicStatus('ready');
          console.log('Audio loaded successfully from:', successfulPath);
          
          // Auto-play music as soon as it's loaded
          try {
            if (audioRef.current) {
              // Resume audio context if needed (for autoplay policies)
              if (audioRef.current.readyState >= 2) { // HAVE_CURRENT_DATA
                await audioRef.current.play();
                setIsPlaying(true);
                setMusicStatus('playing');
                console.log('Auto-playing music after successful load');
                
                // Save the auto-play state to localStorage
                localStorage.setItem('pablo_music_state', JSON.stringify({
                  isPlaying: true,
                  volume
                }));
              }
            }
          } catch (error) {
            console.warn('Auto-play failed, user interaction required:', error);
            setMusicStatus('paused');
            // Don't set isPlaying to false here, let user manually start
          }
        });

        // Add error handling for audio loading
        audioRef.current.addEventListener('error', (e) => {
          console.warn('Failed to load audio after fetch:', e);
          setMusicStatus('error');
          audioRef.current = null;
        });

        // Load saved music state from localStorage
        const savedMusicState = localStorage.getItem('pablo_music_state');
        if (savedMusicState) {
          const { isPlaying: savedIsPlaying, volume: savedVolume } = JSON.parse(savedMusicState);
          setIsPlaying(savedIsPlaying);
          setVolume(savedVolume);
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

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

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
        isPlaying: !isPlaying,
        volume
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
      setVolume: handleVolumeChange,
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
