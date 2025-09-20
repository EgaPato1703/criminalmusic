const express = require('express');
const { authenticateWebApp, authenticateToken } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const User = require('../models/User');

const router = express.Router();

// Login with Telegram WebApp
router.post('/login', authenticateWebApp, catchAsync(async (req, res) => {
  res.json({
    success: true,
    message: 'Добро пожаловать в Criminal Music',
    data: {
      token: req.token,
      user: {
        id: req.user._id,
        telegramId: req.user.telegramId,
        username: req.user.username,
        displayName: req.user.displayName,
        role: req.user.role,
        avatar: req.user.avatar,
        stats: req.user.stats,
        criminalTheme: req.user.criminalTheme,
        isNewUser: req.user.createdAt > new Date(Date.now() - 60000) // Created in last minute
      }
    }
  });
}));

// Get current user profile
router.get('/me', authenticateToken, catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('likedTracks', 'title artist coverArt stats')
    .populate('followedArtists', 'username artistProfile avatar stats');
  
  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        status: user.status,
        artistProfile: user.artistProfile,
        criminalTheme: user.criminalTheme,
        stats: user.stats,
        preferences: user.preferences,
        likedTracks: user.likedTracks,
        followedArtists: user.followedArtists,
        reputationLevel: user.reputationLevel,
        lastActive: user.lastActive
      }
    }
  });
}));

// Setup user role (for new users)
router.post('/setup-role', authenticateToken, catchAsync(async (req, res) => {
  const { role, artistProfile } = req.body;
  
  if (!['listener', 'artist'].includes(role)) {
    return res.status(400).json({
      error: 'Invalid role',
      message: 'Выбери свою роль: слушатель или артист',
      code: 'INVALID_ROLE'
    });
  }
  
  const user = req.user;
  user.role = role;
  
  if (role === 'artist' && artistProfile) {
    user.artistProfile = {
      pseudonym: artistProfile.pseudonym,
      city: artistProfile.city,
      genre: artistProfile.genre,
      description: artistProfile.description
    };
  }
  
  await user.save();
  
  res.json({
    success: true,
    message: role === 'artist' ? 'Добро пожаловать в ряды артистов!' : 'Теперь ты слушатель!',
    data: {
      user: {
        id: user._id,
        role: user.role,
        artistProfile: user.artistProfile,
        displayName: user.displayName
      }
    }
  });
}));

// Refresh token
router.post('/refresh', authenticateToken, catchAsync(async (req, res) => {
  const { generateToken } = require('../middleware/auth');
  const newToken = generateToken(req.user._id);
  
  res.json({
    success: true,
    message: 'Token refreshed',
    data: {
      token: newToken
    }
  });
}));

// Logout (client-side token removal, but we can track it)
router.post('/logout', authenticateToken, catchAsync(async (req, res) => {
  // In a more advanced implementation, you might want to blacklist the token
  // For now, just acknowledge the logout
  
  res.json({
    success: true,
    message: 'До встречи в тёмных переулках музыки!'
  });
}));

module.exports = router;

