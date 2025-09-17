import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        transports: ['websocket'],
        timeout: 20000,
        forceNew: true
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('🔗 Connected to Criminal Music server');
        setIsConnected(true);
        
        // Join user's personal room for notifications
        newSocket.emit('join-user-room', user.id);
        
        toast.success('Подключён к серверу', { 
          icon: '🔗',
          duration: 2000
        });
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Real-time events
      newSocket.on('new-follower', (data) => {
        toast.success(`${data.username} теперь следит за вами!`, {
          icon: '👤',
          duration: 4000
        });
      });

      newSocket.on('follower-removed', (data) => {
        toast(`${data.username} отписался`, {
          icon: '👋',
          duration: 3000
        });
      });

      newSocket.on('track-liked', (data) => {
        toast.success(`${data.user.username} оценил "${data.track.title}"!`, {
          icon: '❤️',
          duration: 4000
        });
      });

      newSocket.on('new-comment', (data) => {
        toast.success(`Новый комментарий к "${data.track.title}"`, {
          icon: '💬',
          duration: 4000
        });
      });

      newSocket.on('new-track', (data) => {
        toast.success(`${data.track.artist.displayName} выпустил новый трек!`, {
          icon: '🎵',
          duration: 5000
        });
      });

      newSocket.on('track-playing', (data) => {
        // Could be used for "now playing" features
        console.log('Someone is playing:', data);
      });

      newSocket.on('user-count', (count) => {
        setOnlineUsers(count);
      });

      // Notification events
      newSocket.on('notification', (notification) => {
        const { type, message, data } = notification;
        
        switch (type) {
          case 'track_featured':
            toast.success(`🌟 ${message}`, { duration: 6000 });
            break;
          case 'achievement_unlocked':
            toast.success(`🏆 ${message}`, { duration: 6000 });
            break;
          case 'reputation_milestone':
            toast.success(`⭐ ${message}`, { duration: 5000 });
            break;
          case 'playlist_shared':
            toast(`📋 ${message}`, { duration: 4000 });
            break;
          default:
            toast(message, { duration: 4000 });
        }
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [isAuthenticated, user]);

  // Socket utility functions
  const emitTrackPlay = (trackId) => {
    if (socket && isConnected) {
      socket.emit('track-play', {
        trackId,
        userId: user?.id,
        timestamp: new Date()
      });
    }
  };

  const emitUserActivity = (activity) => {
    if (socket && isConnected) {
      socket.emit('user-activity', {
        userId: user?.id,
        activity,
        timestamp: new Date()
      });
    }
  };

  const joinRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit('join-room', roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit('leave-room', roomId);
    }
  };

  const sendMessage = (roomId, message) => {
    if (socket && isConnected) {
      socket.emit('send-message', {
        roomId,
        message,
        userId: user?.id,
        timestamp: new Date()
      });
    }
  };

  // Custom event listeners
  const addEventListener = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
    return () => {};
  };

  const removeEventListener = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    emitTrackPlay,
    emitUserActivity,
    joinRoom,
    leaveRoom,
    sendMessage,
    addEventListener,
    removeEventListener
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
