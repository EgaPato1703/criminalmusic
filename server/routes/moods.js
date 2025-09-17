const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const Track = require('../models/Track');
const config = require('../config');

const router = express.Router();

// Get all available moods
router.get('/', catchAsync(async (req, res) => {
  const moods = Object.entries(config.MOOD_CATEGORIES).map(([key, value]) => ({
    id: key.toLowerCase(),
    name: value.name,
    icon: value.icon,
    tags: value.tags
  }));
  
  res.json({
    success: true,
    data: { moods }
  });
}));

// Generate radio playlist by mood
router.get('/:mood/radio', optionalAuth, catchAsync(async (req, res) => {
  const { mood } = req.params;
  const { limit = 50, shuffle = true } = req.query;
  
  const moodConfig = config.MOOD_CATEGORIES[mood.toUpperCase()];
  
  if (!moodConfig) {
    return res.status(400).json({
      error: 'Unknown mood',
      message: 'Неизвестное настроение',
      code: 'UNKNOWN_MOOD'
    });
  }
  
  // Get tracks by mood tags
  let tracks = await Track.find({
    'criminalMetadata.moodTags': { $in: moodConfig.tags },
    visibility: 'public',
    moderationStatus: 'approved'
  })
  .populate('artist', 'username displayName avatar artistProfile')
  .select('title artist artistName coverArt audioFile stats criminalMetadata genre');
  
  // Add some randomness to the selection
  if (shuffle === 'true' && tracks.length > limit) {
    tracks = tracks.sort(() => 0.5 - Math.random());
  } else {
    // Sort by popularity and recency
    tracks = tracks.sort((a, b) => {
      const scoreA = a.stats.plays * 0.7 + a.stats.likes * 0.3;
      const scoreB = b.stats.plays * 0.7 + b.stats.likes * 0.3;
      return scoreB - scoreA;
    });
  }
  
  tracks = tracks.slice(0, parseInt(limit));
  
  // Generate playlist metadata
  const totalDuration = tracks.reduce((sum, track) => sum + (track.audioFile.duration || 0), 0);
  const averageIntensity = tracks.reduce((sum, track) => 
    sum + (track.criminalMetadata.intensity || 5), 0) / tracks.length;
  
  res.json({
    success: true,
    data: {
      playlist: {
        id: `${mood}_radio_${Date.now()}`,
        name: `${moodConfig.name} Радио`,
        description: `Плейлист в настроении "${moodConfig.name}" - музыка для тёмных улиц`,
        mood: {
          id: mood,
          name: moodConfig.name,
          icon: moodConfig.icon,
          tags: moodConfig.tags
        },
        tracks,
        stats: {
          totalTracks: tracks.length,
          totalDuration,
          averageIntensity: Math.round(averageIntensity * 10) / 10
        },
        generatedAt: new Date()
      }
    }
  });
}));

// Get mood statistics
router.get('/:mood/stats', catchAsync(async (req, res) => {
  const { mood } = req.params;
  
  const moodConfig = config.MOOD_CATEGORIES[mood.toUpperCase()];
  
  if (!moodConfig) {
    return res.status(400).json({
      error: 'Unknown mood',
      message: 'Неизвестное настроение',
      code: 'UNKNOWN_MOOD'
    });
  }
  
  // Get statistics for this mood
  const totalTracks = await Track.countDocuments({
    'criminalMetadata.moodTags': { $in: moodConfig.tags },
    visibility: 'public',
    moderationStatus: 'approved'
  });
  
  const topTracks = await Track.find({
    'criminalMetadata.moodTags': { $in: moodConfig.tags },
    visibility: 'public',
    moderationStatus: 'approved'
  })
  .populate('artist', 'username displayName avatar')
  .sort({ 'stats.plays': -1, 'stats.likes': -1 })
  .limit(5)
  .select('title artist coverArt stats');
  
  // Get genre distribution
  const genreStats = await Track.aggregate([
    {
      $match: {
        'criminalMetadata.moodTags': { $in: moodConfig.tags },
        visibility: 'public',
        moderationStatus: 'approved'
      }
    },
    {
      $group: {
        _id: '$genre',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 5
    }
  ]);
  
  res.json({
    success: true,
    data: {
      mood: {
        id: mood,
        name: moodConfig.name,
        icon: moodConfig.icon
      },
      stats: {
        totalTracks,
        topTracks,
        genreDistribution: genreStats
      }
    }
  });
}));

// Get personalized mood recommendations
router.get('/recommendations/personal', optionalAuth, catchAsync(async (req, res) => {
  if (!req.user) {
    // Return general recommendations for non-authenticated users
    const generalRecommendations = [
      { mood: 'mystery', reason: 'Популярно сегодня', weight: 0.9 },
      { mood: 'energy', reason: 'Заряд энергии', weight: 0.8 },
      { mood: 'aggression', reason: 'Тренд недели', weight: 0.7 }
    ];
    
    return res.json({
      success: true,
      data: { recommendations: generalRecommendations }
    });
  }
  
  const user = req.user;
  const recommendations = [];
  
  // Analyze user's liked tracks for mood preferences
  const likedTracks = await Track.find({
    _id: { $in: user.likedTracks }
  }).select('criminalMetadata');
  
  // Count mood tag frequency
  const moodFrequency = {};
  likedTracks.forEach(track => {
    if (track.criminalMetadata && track.criminalMetadata.moodTags) {
      track.criminalMetadata.moodTags.forEach(tag => {
        moodFrequency[tag] = (moodFrequency[tag] || 0) + 1;
      });
    }
  });
  
  // Map tags to moods and calculate recommendations
  Object.entries(config.MOOD_CATEGORIES).forEach(([moodKey, moodConfig]) => {
    let weight = 0;
    let reason = 'Новое для вас';
    
    moodConfig.tags.forEach(tag => {
      if (moodFrequency[tag]) {
        weight += moodFrequency[tag] / likedTracks.length;
        reason = 'На основе ваших предпочтений';
      }
    });
    
    // Add some randomness and trending factor
    weight += Math.random() * 0.3;
    
    recommendations.push({
      mood: moodKey.toLowerCase(),
      reason,
      weight: Math.round(weight * 100) / 100
    });
  });
  
  // Sort by weight and take top 3
  recommendations.sort((a, b) => b.weight - a.weight);
  const topRecommendations = recommendations.slice(0, 3);
  
  res.json({
    success: true,
    data: { recommendations: topRecommendations }
  });
}));

// Get mood-based discovery
router.get('/:mood/discover', optionalAuth, catchAsync(async (req, res) => {
  const { mood } = req.params;
  const { limit = 10 } = req.query;
  
  const moodConfig = config.MOOD_CATEGORIES[mood.toUpperCase()];
  
  if (!moodConfig) {
    return res.status(400).json({
      error: 'Unknown mood',
      message: 'Неизвестное настроение',
      code: 'UNKNOWN_MOOD'
    });
  }
  
  // Get lesser-known tracks in this mood (discovery focus)
  const tracks = await Track.find({
    'criminalMetadata.moodTags': { $in: moodConfig.tags },
    visibility: 'public',
    moderationStatus: 'approved',
    'stats.plays': { $lt: 1000 } // Less popular tracks for discovery
  })
  .populate('artist', 'username displayName avatar artistProfile')
  .sort({ createdAt: -1, 'stats.likes': -1 })
  .limit(parseInt(limit))
  .select('title artist artistName coverArt audioFile stats criminalMetadata genre createdAt');
  
  res.json({
    success: true,
    data: {
      mood: {
        id: mood,
        name: moodConfig.name,
        icon: moodConfig.icon
      },
      tracks,
      message: 'Новые треки в этом настроении'
    }
  });
}));

module.exports = router;
