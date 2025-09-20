const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const User = require('../models/User');
const Track = require('../models/Track');

const router = express.Router();

// Get user profile by ID
router.get('/:userId', optionalAuth, catchAsync(async (req, res) => {
  const { userId } = req.params;
  
  const user = await User.findById(userId)
    .populate('likedTracks', 'title artist coverArt stats createdAt')
    .select('-telegramId -preferences.notifications'); // Don't expose sensitive data
  
  if (!user || !user.isActive) {
    throw new AppError('Пользователь не найден в нашем районе', 404, 'USER_NOT_FOUND');
  }
  
  // Get user's tracks if artist
  let tracks = [];
  if (user.role === 'artist') {
    tracks = await Track.find({ 
      artist: userId, 
      visibility: 'public',
      moderationStatus: 'approved'
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('title coverArt stats createdAt audioFile');
  }
  
  // Check if current user follows this user
  let isFollowing = false;
  if (req.user && req.user.followedArtists.includes(userId)) {
    isFollowing = true;
  }
  
  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        status: user.status,
        artistProfile: user.artistProfile,
        criminalTheme: user.criminalTheme,
        stats: user.stats,
        reputationLevel: user.reputationLevel,
        lastActive: user.lastActive,
        isFollowing
      },
      tracks: tracks.length > 0 ? tracks : undefined
    }
  });
}));

// Update user profile
router.put('/profile', authenticateToken, catchAsync(async (req, res) => {
  const allowedFields = ['bio', 'status', 'preferences', 'criminalTheme'];
  const updates = {};
  
  // Filter allowed fields
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });
  
  // Handle artist profile updates
  if (req.user.role === 'artist' && req.body.artistProfile) {
    const artistFields = ['pseudonym', 'city', 'genre', 'description'];
    updates.artistProfile = {};
    
    artistFields.forEach(field => {
      if (req.body.artistProfile[field] !== undefined) {
        updates.artistProfile[field] = req.body.artistProfile[field];
      }
    });
  }
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );
  
  res.json({
    success: true,
    message: 'Профиль обновлён',
    data: {
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        status: user.status,
        artistProfile: user.artistProfile,
        criminalTheme: user.criminalTheme,
        preferences: user.preferences
      }
    }
  });
}));

// Follow/unfollow user
router.post('/:userId/follow', authenticateToken, catchAsync(async (req, res) => {
  const { userId } = req.params;
  const currentUser = req.user;
  
  if (userId === currentUser._id.toString()) {
    throw new AppError('Нельзя подписаться на самого себя', 400, 'CANNOT_FOLLOW_SELF');
  }
  
  const targetUser = await User.findById(userId);
  if (!targetUser || !targetUser.isActive) {
    throw new AppError('Пользователь не найден', 404, 'USER_NOT_FOUND');
  }
  
  const isAlreadyFollowing = currentUser.followedArtists.includes(userId);
  
  if (isAlreadyFollowing) {
    // Unfollow
    await currentUser.unfollow(userId);
    targetUser.stats.followers = Math.max(0, targetUser.stats.followers - 1);
    await targetUser.save();
    
    // Emit real-time event
    const io = req.app.get('io');
    io.to(`user-${userId}`).emit('follower-removed', {
      userId: currentUser._id,
      username: currentUser.displayName
    });
    
    res.json({
      success: true,
      message: 'Отписка выполнена',
      data: { isFollowing: false }
    });
  } else {
    // Follow
    await currentUser.follow(userId);
    targetUser.stats.followers += 1;
    await targetUser.save();
    
    // Add reputation to target user
    await targetUser.addReputation(10);
    
    // Emit real-time event
    const io = req.app.get('io');
    io.to(`user-${userId}`).emit('new-follower', {
      userId: currentUser._id,
      username: currentUser.displayName,
      avatar: currentUser.avatar
    });
    
    res.json({
      success: true,
      message: 'Подписка оформлена',
      data: { isFollowing: true }
    });
  }
}));

// Get user's followers
router.get('/:userId/followers', optionalAuth, catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  // Find users who follow this user
  const followers = await User.find({
    followedArtists: userId,
    isActive: true
  })
  .select('username displayName avatar stats.followers criminalTheme')
  .sort({ 'stats.followers': -1 })
  .limit(limit * 1)
  .skip((page - 1) * limit);
  
  const total = await User.countDocuments({
    followedArtists: userId,
    isActive: true
  });
  
  res.json({
    success: true,
    data: {
      followers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Get user's following
router.get('/:userId/following', optionalAuth, catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const user = await User.findById(userId)
    .populate({
      path: 'followedArtists',
      select: 'username displayName avatar stats artistProfile criminalTheme',
      options: {
        sort: { 'stats.followers': -1 },
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      }
    });
  
  if (!user) {
    throw new AppError('Пользователь не найден', 404, 'USER_NOT_FOUND');
  }
  
  res.json({
    success: true,
    data: {
      following: user.followedArtists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: user.stats.following
      }
    }
  });
}));

// Get top artists
router.get('/top/artists', catchAsync(async (req, res) => {
  const { limit = 10, period = 'all' } = req.query;
  
  let dateFilter = {};
  if (period === 'week') {
    dateFilter.lastActive = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  } else if (period === 'month') {
    dateFilter.lastActive = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  }
  
  const artists = await User.find({
    role: 'artist',
    isActive: true,
    ...dateFilter
  })
  .select('username displayName avatar stats artistProfile criminalTheme')
  .sort({ 'stats.followers': -1, 'stats.totalLikes': -1 })
  .limit(parseInt(limit));
  
  res.json({
    success: true,
    data: { artists }
  });
}));

// Search users
router.get('/search/query', catchAsync(async (req, res) => {
  const { q, role, limit = 10 } = req.query;
  
  if (!q || q.length < 2) {
    throw new AppError('Поисковый запрос слишком короткий', 400, 'QUERY_TOO_SHORT');
  }
  
  const searchQuery = {
    isActive: true,
    $or: [
      { username: { $regex: q, $options: 'i' } },
      { 'artistProfile.pseudonym': { $regex: q, $options: 'i' } },
      { 'criminalTheme.nickname': { $regex: q, $options: 'i' } }
    ]
  };
  
  if (role && ['listener', 'artist'].includes(role)) {
    searchQuery.role = role;
  }
  
  const users = await User.find(searchQuery)
    .select('username displayName avatar role stats artistProfile criminalTheme')
    .sort({ 'stats.followers': -1 })
    .limit(parseInt(limit));
  
  res.json({
    success: true,
    data: { users }
  });
}));

module.exports = router;

