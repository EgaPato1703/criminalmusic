import axios from 'axios';
import toast from 'react-hot-toast';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('criminalMusicToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshResponse = await api.post('/auth/refresh');
        const newToken = refreshResponse.data.token;
        
        localStorage.setItem('criminalMusicToken', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('criminalMusicToken');
        window.location.reload();
        return Promise.reject(refreshError);
      }
    }
    
    // Handle different error types
    const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
    const errorCode = error.response?.data?.code || 'UNKNOWN_ERROR';
    
    // Show appropriate error messages
    if (error.response?.status >= 500) {
      toast.error('Ошибка сервера. Попробуйте позже.', { icon: '🚨' });
    } else if (error.response?.status === 404) {
      toast.error('Ресурс не найден', { icon: '🔍' });
    } else if (error.response?.status === 403) {
      toast.error('Доступ запрещён', { icon: '🚫' });
    } else if (!originalRequest._retry) {
      toast.error(errorMessage, { icon: '⚠️' });
    }
    
    return Promise.reject({
      message: errorMessage,
      code: errorCode,
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

// Auth API
export const authAPI = {
  login: (initData) => api.post('/auth/login', { initData }),
  getProfile: () => api.get('/auth/me'),
  setupRole: (roleData) => api.post('/auth/setup-role', roleData),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  refreshToken: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout')
};

// Users API
export const usersAPI = {
  getUser: (userId) => api.get(`/users/${userId}`),
  followUser: (userId) => api.post(`/users/${userId}/follow`),
  getFollowers: (userId, params = {}) => api.get(`/users/${userId}/followers`, { params }),
  getFollowing: (userId, params = {}) => api.get(`/users/${userId}/following`, { params }),
  getTopArtists: (params = {}) => api.get('/users/top/artists', { params }),
  searchUsers: (params = {}) => api.get('/users/search/query', { params })
};

// Tracks API
export const tracksAPI = {
  getTracks: (params = {}) => api.get('/tracks', { params }),
  getTrack: (trackId) => api.get(`/tracks/${trackId}`),
  createTrack: (trackData) => api.post('/tracks', trackData),
  updateTrack: (trackId, trackData) => api.put(`/tracks/${trackId}`, trackData),
  deleteTrack: (trackId) => api.delete(`/tracks/${trackId}`),
  likeTrack: (trackId) => api.post(`/tracks/${trackId}/like`),
  playTrack: (trackId) => api.post(`/tracks/${trackId}/play`),
  getComments: (trackId, params = {}) => api.get(`/tracks/${trackId}/comments`, { params }),
  addComment: (trackId, commentData) => api.post(`/tracks/${trackId}/comments`, commentData),
  getTrending: (params = {}) => api.get('/tracks/trending/now', { params }),
  getByMood: (mood, params = {}) => api.get(`/tracks/mood/${mood}`, { params })
};

// Albums API
export const albumsAPI = {
  getAlbums: (params = {}) => api.get('/albums', { params }),
  getAlbum: (albumId) => api.get(`/albums/${albumId}`),
  createAlbum: (albumData) => api.post('/albums', albumData),
  updateAlbum: (albumId, albumData) => api.put(`/albums/${albumId}`, albumData),
  deleteAlbum: (albumId) => api.delete(`/albums/${albumId}`),
  addTrackToAlbum: (albumId, trackId) => api.post(`/albums/${albumId}/tracks`, { trackId }),
  removeTrackFromAlbum: (albumId, trackId) => api.delete(`/albums/${albumId}/tracks/${trackId}`),
  getFeatured: (params = {}) => api.get('/albums/featured/list', { params })
};

// Playlists API
export const playlistsAPI = {
  getMyPlaylists: () => api.get('/playlists/my'),
  getPublicPlaylists: (params = {}) => api.get('/playlists/public', { params }),
  getPlaylist: (playlistId) => api.get(`/playlists/${playlistId}`),
  createPlaylist: (playlistData) => api.post('/playlists', playlistData),
  updatePlaylist: (playlistId, playlistData) => api.put(`/playlists/${playlistId}`, playlistData),
  deletePlaylist: (playlistId) => api.delete(`/playlists/${playlistId}`),
  addTrackToPlaylist: (playlistId, trackId) => api.post(`/playlists/${playlistId}/tracks`, { trackId }),
  removeTrackFromPlaylist: (playlistId, trackId) => api.delete(`/playlists/${playlistId}/tracks/${trackId}`),
  reorderTracks: (playlistId, trackOrder) => api.put(`/playlists/${playlistId}/reorder`, { trackOrder }),
  followPlaylist: (playlistId) => api.post(`/playlists/${playlistId}/follow`)
};

// Search API
export const searchAPI = {
  search: (params = {}) => api.get('/search', { params }),
  getSuggestions: (params = {}) => api.get('/search/suggestions', { params }),
  getTrending: () => api.get('/search/trending'),
  advancedSearch: (searchData) => api.post('/search/advanced', searchData),
  getHistory: () => api.get('/search/history'),
  clearHistory: () => api.delete('/search/history')
};

// Moods API
export const moodsAPI = {
  getMoods: () => api.get('/moods'),
  getMoodRadio: (mood, params = {}) => api.get(`/moods/${mood}/radio`, { params }),
  getMoodStats: (mood) => api.get(`/moods/${mood}/stats`),
  getPersonalRecommendations: () => api.get('/moods/recommendations/personal'),
  getMoodDiscovery: (mood, params = {}) => api.get(`/moods/${mood}/discover`, { params })
};

// Upload API
export const uploadAPI = {
  uploadAudio: (audioFile, onProgress) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    return api.post('/upload/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
  },
  
  uploadImage: (imageFile, type = 'cover', onProgress) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('type', type);
    
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
  },
  
  uploadBatch: (files, onProgress) => {
    const formData = new FormData();
    
    files.audio?.forEach((file, index) => {
      formData.append('audio', file);
    });
    
    if (files.cover) {
      formData.append('cover', files.cover);
    }
    
    return api.post('/upload/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
  },
  
  getUploadProgress: (uploadId) => api.get(`/upload/progress/${uploadId}`),
  deleteFile: (publicId) => api.delete(`/upload/${publicId}`)
};

// Utility functions
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.code === 'NETWORK_ERROR') {
    toast.error('Проблемы с сетью. Проверьте подключение.', { icon: '📡' });
  } else if (error.status === 429) {
    toast.error('Слишком много запросов. Подождите немного.', { icon: '⏳' });
  } else {
    toast.error(error.message || 'Произошла ошибка', { icon: '⚠️' });
  }
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default api;

