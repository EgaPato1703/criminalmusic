import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { tracksAPI } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';
import toast from 'react-hot-toast';

const PlayerContext = createContext();

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

export const PlayerProvider = ({ children }) => {
  // Player state
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none'); // 'none', 'one', 'all'
  
  // Playlist state
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [history, setHistory] = useState([]);
  
  // Audio instance
  const howlRef = useRef(null);
  const progressInterval = useRef(null);
  
  const { hapticFeedback } = useTelegram();

  // Initialize audio progress tracking
  useEffect(() => {
    if (isPlaying && howlRef.current) {
      progressInterval.current = setInterval(() => {
        const seek = howlRef.current.seek();
        if (typeof seek === 'number' && !isNaN(seek)) {
          setCurrentTime(seek);
        }
      }, 1000);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (howlRef.current) {
        howlRef.current.unload();
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const loadTrack = async (track, playlistTracks = [], startIndex = 0) => {
    try {
      setIsLoading(true);
      
      // Stop current track
      if (howlRef.current) {
        howlRef.current.unload();
      }

      // Update playlist if provided
      if (playlistTracks.length > 0) {
        setPlaylist(playlistTracks);
        setCurrentIndex(startIndex);
      }

      // Create new Howl instance
      const howl = new Howl({
        src: [track.audioFile.url],
        html5: true,
        preload: true,
        volume: isMuted ? 0 : volume,
        onload: () => {
          setIsLoading(false);
          setDuration(howl.duration());
          console.log('Track loaded:', track.title);
        },
        onplay: () => {
          setIsPlaying(true);
          hapticFeedback('light');
        },
        onpause: () => {
          setIsPlaying(false);
        },
        onstop: () => {
          setIsPlaying(false);
          setCurrentTime(0);
        },
        onend: () => {
          handleTrackEnd();
        },
        onloaderror: (id, error) => {
          console.error('Audio load error:', error);
          setIsLoading(false);
          toast.error('Ошибка загрузки трека', { icon: '🚨' });
        },
        onplayerror: (id, error) => {
          console.error('Audio play error:', error);
          toast.error('Ошибка воспроизведения', { icon: '⚠️' });
        }
      });

      howlRef.current = howl;
      setCurrentTrack(track);
      
      // Add to history
      setHistory(prev => [track, ...prev.slice(0, 49)]); // Keep last 50 tracks
      
      // Track play count
      try {
        await tracksAPI.playTrack(track.id);
      } catch (error) {
        console.error('Failed to track play:', error);
      }

    } catch (error) {
      console.error('Load track error:', error);
      setIsLoading(false);
      toast.error('Не удалось загрузить трек');
    }
  };

  const play = async (track = null, playlistTracks = [], startIndex = 0) => {
    try {
      if (track && track.id !== currentTrack?.id) {
        await loadTrack(track, playlistTracks, startIndex);
      }

      if (howlRef.current) {
        howlRef.current.play();
      }
    } catch (error) {
      console.error('Play error:', error);
      toast.error('Ошибка воспроизведения');
    }
  };

  const pause = () => {
    if (howlRef.current) {
      howlRef.current.pause();
    }
  };

  const stop = () => {
    if (howlRef.current) {
      howlRef.current.stop();
    }
    setCurrentTime(0);
  };

  const seek = (time) => {
    if (howlRef.current) {
      howlRef.current.seek(time);
      setCurrentTime(time);
    }
  };

  const setPlayerVolume = (newVolume) => {
    setVolume(newVolume);
    if (howlRef.current && !isMuted) {
      howlRef.current.volume(newVolume);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (howlRef.current) {
      howlRef.current.volume(newMuted ? 0 : volume);
    }
  };

  const handleTrackEnd = () => {
    switch (repeatMode) {
      case 'one':
        // Repeat current track
        if (howlRef.current) {
          howlRef.current.seek(0);
          howlRef.current.play();
        }
        break;
      case 'all':
        // Play next track, or first if at end
        playNext();
        break;
      default:
        // Play next track if available
        if (currentIndex < playlist.length - 1) {
          playNext();
        } else {
          setIsPlaying(false);
          setCurrentTime(0);
        }
        break;
    }
  };

  const playNext = () => {
    if (playlist.length === 0) return;

    let nextIndex;
    
    if (isShuffling) {
      // Random track (excluding current)
      const availableIndices = playlist
        .map((_, index) => index)
        .filter(index => index !== currentIndex);
      nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    } else {
      // Next track in order
      nextIndex = currentIndex + 1;
      if (nextIndex >= playlist.length) {
        nextIndex = repeatMode === 'all' ? 0 : currentIndex;
      }
    }

    if (nextIndex < playlist.length && nextIndex !== currentIndex) {
      const nextTrack = playlist[nextIndex];
      setCurrentIndex(nextIndex);
      play(nextTrack);
    }
  };

  const playPrevious = () => {
    if (playlist.length === 0) return;

    // If more than 3 seconds played, restart current track
    if (currentTime > 3) {
      seek(0);
      return;
    }

    let prevIndex;
    
    if (isShuffling) {
      // Previous from history or random
      if (history.length > 1) {
        const prevTrack = history[1]; // Skip current track
        const foundIndex = playlist.findIndex(track => track.id === prevTrack.id);
        prevIndex = foundIndex !== -1 ? foundIndex : Math.floor(Math.random() * playlist.length);
      } else {
        prevIndex = Math.floor(Math.random() * playlist.length);
      }
    } else {
      // Previous track in order
      prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = repeatMode === 'all' ? playlist.length - 1 : 0;
      }
    }

    if (prevIndex >= 0 && prevIndex < playlist.length) {
      const prevTrack = playlist[prevIndex];
      setCurrentIndex(prevIndex);
      play(prevTrack);
    }
  };

  const toggleShuffle = () => {
    setIsShuffling(prev => !prev);
    hapticFeedback('selection');
  };

  const cycleRepeat = () => {
    const modes = ['none', 'one', 'all'];
    const currentModeIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    setRepeatMode(nextMode);
    hapticFeedback('selection');
  };

  const addToQueue = (track) => {
    setPlaylist(prev => [...prev, track]);
    toast.success(`${track.title} добавлен в очередь`, { icon: '➕' });
  };

  const removeFromQueue = (index) => {
    setPlaylist(prev => {
      const newPlaylist = prev.filter((_, i) => i !== index);
      
      // Adjust current index if needed
      if (index < currentIndex) {
        setCurrentIndex(prev => prev - 1);
      } else if (index === currentIndex && newPlaylist.length > 0) {
        // If removing current track, stop playback
        stop();
        setCurrentTrack(null);
        setCurrentIndex(-1);
      }
      
      return newPlaylist;
    });
  };

  const clearQueue = () => {
    stop();
    setPlaylist([]);
    setCurrentIndex(-1);
    setCurrentTrack(null);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const value = {
    // State
    currentTrack,
    isPlaying,
    isLoading,
    duration,
    currentTime,
    volume,
    isMuted,
    isShuffling,
    repeatMode,
    playlist,
    currentIndex,
    history,
    
    // Actions
    play,
    pause,
    stop,
    seek,
    setPlayerVolume,
    toggleMute,
    playNext,
    playPrevious,
    toggleShuffle,
    cycleRepeat,
    addToQueue,
    removeFromQueue,
    clearQueue,
    
    // Utilities
    formatTime
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

