import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('criminalMusicToken'));
  const { webApp, user: tgUser } = useTelegram();

  const isAuthenticated = !!user && !!token;

  // Initialize authentication
  useEffect(() => {
    initializeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeAuth = async () => {
    try {
      if (token) {
        // Try to get user profile with existing token
        const userData = await authAPI.getProfile();
        setUser(userData.user);
        toast.success(`Добро пожаловать обратно, ${userData.user.displayName}!`);
      } else if (webApp && tgUser) {
        // Try to login with Telegram WebApp data
        await loginWithTelegram();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Clear invalid token
      localStorage.removeItem('criminalMusicToken');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const loginWithTelegram = async () => {
    try {
      setLoading(true);
      
      if (!webApp || !webApp.initData) {
        throw new Error('Telegram WebApp data not available');
      }

      const response = await authAPI.login(webApp.initData);
      
      if (response.success) {
        const { token: newToken, user: userData } = response.data;
        
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('criminalMusicToken', newToken);
        
        if (userData.isNewUser) {
          toast.success('Добро пожаловать в Criminal Music!', {
            duration: 5000,
            icon: '🎵'
          });
        } else {
          toast.success(`С возвращением, ${userData.displayName}!`, {
            icon: '🔥'
          });
        }
        
        return userData;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Telegram login error:', error);
      toast.error('Ошибка входа через Telegram', {
        icon: '🚨'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const setupUserRole = async (roleData) => {
    try {
      setLoading(true);
      
      const response = await authAPI.setupRole(roleData);
      
      if (response.success) {
        const updatedUser = { ...user, ...response.data.user };
        setUser(updatedUser);
        
        toast.success(response.message, {
          icon: roleData.role === 'artist' ? '🎤' : '🎧'
        });
        
        return updatedUser;
      } else {
        throw new Error(response.message || 'Role setup failed');
      }
    } catch (error) {
      console.error('Role setup error:', error);
      toast.error('Ошибка настройки профиля');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      
      if (response.success) {
        const updatedUser = { ...user, ...response.data.user };
        setUser(updatedUser);
        
        toast.success('Профиль обновлён', {
          icon: '✅'
        });
        
        return updatedUser;
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Ошибка обновления профиля');
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      const response = await authAPI.refreshToken();
      
      if (response.success) {
        const newToken = response.data.token;
        setToken(newToken);
        localStorage.setItem('criminalMusicToken', newToken);
        return newToken;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('criminalMusicToken');
      
      toast.success('До встречи в тёмных переулках!', {
        icon: '👋'
      });
      
      // Close Telegram WebApp
      if (webApp) {
        webApp.close();
      }
    }
  };

  const addReputation = (points) => {
    if (user && user.criminalTheme) {
      setUser(prevUser => ({
        ...prevUser,
        criminalTheme: {
          ...prevUser.criminalTheme,
          reputation: (prevUser.criminalTheme.reputation || 0) + points
        }
      }));
    }
  };

  const updateStats = (statUpdates) => {
    if (user && user.stats) {
      setUser(prevUser => ({
        ...prevUser,
        stats: {
          ...prevUser.stats,
          ...statUpdates
        }
      }));
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    loginWithTelegram,
    setupUserRole,
    updateProfile,
    refreshToken,
    logout,
    addReputation,
    updateStats
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
