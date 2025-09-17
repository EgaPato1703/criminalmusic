const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const Track = require('../models/Track');
const User = require('../models/User');
const Album = require('../models/Album');

const router = express.Router();

// Universal search endpoint
router.get('/', optionalAuth, catchAsync(async (req, res) => {
  const { 
    q, 
    type = 'all', // 'all', 'tracks', 'artists', 'albums'
    limit = 10,
    genre,
    mood
  } = req.query;
  
  if (!q || q.length < 2) {
    throw new AppError('Поисковый запрос слишком короткий', 400, 'QUERY_TOO_SHORT');
  }
  
  const results = {};
  
  // Search tracks
  if (type === 'all' || type === 'tracks') {
    const trackFilters = {
      visibility: 'public',
      moderationStatus: 'approved'
    };
    
    if (genre) trackFilters.genre = genre;
    if (mood) trackFilters['criminalMetadata.moodTags'] = { $in: [mood] };
    
    const tracks = await Track.searchTracks(q, trackFilters)
      .limit(parseInt(limit))
      .select('title artist artistName coverArt stats criminalMetadata genre createdAt');
    
    results.tracks = tracks;
  }
  
  // Search artists
  if (type === 'all' || type === 'artists') {
    const artists = await User.find({
      role: 'artist',
      isActive: true,
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { 'artistProfile.pseudonym': { $regex: q, $options: 'i' } },
        { 'artistProfile.genre': { $regex: q, $options: 'i' } },
        { 'criminalTheme.nickname': { $regex: q, $options: 'i' } }
      ]
    })
    .select('username displayName avatar artistProfile stats criminalTheme')
    .sort({ 'stats.followers': -1 })
    .limit(parseInt(limit));
    
    results.artists = artists;
  }
  
  // Search albums
  if (type === 'all' || type === 'albums') {
    const albums = await Album.find({
      visibility: 'public',
      moderationStatus: 'approved',
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { artistName: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    })
    .populate('artist', 'username displayName avatar')
    .select('title artist artistName coverArt stats genre createdAt')
    .sort({ 'stats.plays': -1 })
    .limit(parseInt(limit));
    
    results.albums = albums;
  }
  
  // Calculate total results
  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
  
  res.json({
    success: true,
    data: {
      query: q,
      results,
      totalResults,
      searchTime: Date.now() // In production, calculate actual search time
    }
  });
}));

// Get search suggestions (autocomplete)
router.get('/suggestions', catchAsync(async (req, res) => {
  const { q, limit = 5 } = req.query;
  
  if (!q || q.length < 2) {
    return res.json({
      success: true,
      data: { suggestions: [] }
    });
  }
  
  const suggestions = [];
  
  // Track title suggestions
  const trackSuggestions = await Track.find({
    title: { $regex: `^${q}`, $options: 'i' },
    visibility: 'public',
    moderationStatus: 'approved'
  })
  .select('title')
  .limit(parseInt(limit))
  .distinct('title');
  
  trackSuggestions.forEach(title => {
    suggestions.push({
      text: title,
      type: 'track',
      category: 'Треки'
    });
  });
  
  // Artist name suggestions
  const artistSuggestions = await User.find({
    role: 'artist',
    isActive: true,
    $or: [
      { username: { $regex: `^${q}`, $options: 'i' } },
      { 'artistProfile.pseudonym': { $regex: `^${q}`, $options: 'i' } }
    ]
  })
  .select('username artistProfile.pseudonym')
  .limit(parseInt(limit));
  
  artistSuggestions.forEach(artist => {
    const name = artist.artistProfile.pseudonym || artist.username;
    suggestions.push({
      text: name,
      type: 'artist',
      category: 'Артисты'
    });
  });
  
  // Genre suggestions
  const genreSuggestions = await Track.find({
    genre: { $regex: `^${q}`, $options: 'i' },
    visibility: 'public'
  })
  .select('genre')
  .limit(parseInt(limit))
  .distinct('genre');
  
  genreSuggestions.forEach(genre => {
    suggestions.push({
      text: genre,
      type: 'genre',
      category: 'Жанры'
    });
  });
  
  // Remove duplicates and limit results
  const uniqueSuggestions = suggestions
    .filter((item, index, self) => 
      index === self.findIndex(t => t.text === item.text && t.type === item.type)
    )
    .slice(0, parseInt(limit) * 3);
  
  res.json({
    success: true,
    data: { suggestions: uniqueSuggestions }
  });
}));

// Get trending searches
router.get('/trending', catchAsync(async (req, res) => {
  // In production, implement actual trending search tracking
  // For now, return mock trending searches
  
  const trendingSearches = [
    { query: 'underground rap', count: 1250, category: 'Жанр' },
    { query: 'ночные улицы', count: 980, category: 'Настроение' },
    { query: 'криминальный бит', count: 750, category: 'Стиль' },
    { query: 'тёмный город', count: 620, category: 'Тема' },
    { query: 'побег', count: 540, category: 'Настроение' }
  ];
  
  res.json({
    success: true,
    data: { trending: trendingSearches }
  });
}));

// Advanced search with filters
router.post('/advanced', optionalAuth, catchAsync(async (req, res) => {
  const {
    query,
    filters = {},
    sort = 'relevance',
    page = 1,
    limit = 20
  } = req.body;
  
  if (!query || query.length < 2) {
    throw new AppError('Поисковый запрос слишком короткий', 400, 'QUERY_TOO_SHORT');
  }
  
  // Build search query
  let searchQuery = {
    $text: { $search: query },
    visibility: 'public',
    moderationStatus: 'approved'
  };
  
  // Apply filters
  if (filters.genre) searchQuery.genre = { $in: filters.genre };
  if (filters.mood) searchQuery['criminalMetadata.moodTags'] = { $in: filters.mood };
  if (filters.artist) searchQuery.artist = { $in: filters.artist };
  if (filters.dateRange) {
    const { from, to } = filters.dateRange;
    searchQuery.createdAt = {};
    if (from) searchQuery.createdAt.$gte = new Date(from);
    if (to) searchQuery.createdAt.$lte = new Date(to);
  }
  if (filters.duration) {
    const { min, max } = filters.duration;
    searchQuery['audioFile.duration'] = {};
    if (min) searchQuery['audioFile.duration'].$gte = min;
    if (max) searchQuery['audioFile.duration'].$lte = max;
  }
  
  // Determine sort order
  let sortQuery = {};
  switch (sort) {
    case 'popular':
      sortQuery = { 'stats.likes': -1, 'stats.plays': -1 };
      break;
    case 'recent':
      sortQuery = { createdAt: -1 };
      break;
    case 'duration':
      sortQuery = { 'audioFile.duration': 1 };
      break;
    case 'relevance':
    default:
      sortQuery = { score: { $meta: 'textScore' } };
      break;
  }
  
  const tracks = await Track.find(searchQuery)
    .populate('artist', 'username displayName avatar artistProfile')
    .sort(sortQuery)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
  
  const total = await Track.countDocuments(searchQuery);
  
  res.json({
    success: true,
    data: {
      tracks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      appliedFilters: filters,
      query
    }
  });
}));

// Get search history (for logged in users)
router.get('/history', optionalAuth, catchAsync(async (req, res) => {
  if (!req.user) {
    return res.json({
      success: true,
      data: { history: [] }
    });
  }
  
  // In production, implement actual search history tracking
  // For now, return mock history
  
  const mockHistory = [
    { query: 'underground', timestamp: new Date(Date.now() - 3600000) },
    { query: 'криминальный рэп', timestamp: new Date(Date.now() - 7200000) },
    { query: 'ночная музыка', timestamp: new Date(Date.now() - 10800000) }
  ];
  
  res.json({
    success: true,
    data: { history: mockHistory }
  });
}));

// Clear search history
router.delete('/history', optionalAuth, catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError('Необходима авторизация', 401, 'AUTH_REQUIRED');
  }
  
  // In production, implement actual history clearing
  
  res.json({
    success: true,
    message: 'История поиска очищена'
  });
}));

module.exports = router;
