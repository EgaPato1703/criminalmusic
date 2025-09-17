const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const mongoose = require('mongoose');

const router = express.Router();

// Playlist schema (embedded in user collections for simplicity)
const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tracks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track'
  }],
  coverImage: {
    url: String,
    publicId: String
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  criminalTheme: {
    style: {
      type: String,
      enum: ['collection', 'evidence', 'stash', 'diary'],
      default: 'collection'
    },
    mood: String
  },
  stats: {
    followers: { type: Number, default: 0 },
    plays: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

const Playlist = mongoose.model('Playlist', playlistSchema);

// Get user's playlists
router.get('/my', authenticateToken, catchAsync(async (req, res) => {
  const playlists = await Playlist.find({ owner: req.user._id })
    .populate({
      path: 'tracks',
      populate: {
        path: 'artist',
        select: 'username displayName avatar'
      }
    })
    .sort({ updatedAt: -1 });
  
  res.json({
    success: true,
    data: { playlists }
  });
}));

// Get public playlists
router.get('/public', optionalAuth, catchAsync(async (req, res) => {
  const { page = 1, limit = 20, sort = 'recent' } = req.query;
  
  let sortQuery = {};
  switch (sort) {
    case 'popular':
      sortQuery = { 'stats.followers': -1, 'stats.plays': -1 };
      break;
    case 'recent':
    default:
      sortQuery = { updatedAt: -1 };
      break;
  }
  
  const playlists = await Playlist.find({ isPublic: true })
    .populate('owner', 'username displayName avatar')
    .populate({
      path: 'tracks',
      select: 'title artist coverArt',
      populate: {
        path: 'artist',
        select: 'username displayName'
      },
      options: { limit: 3 } // Just show first 3 tracks as preview
    })
    .sort(sortQuery)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
  
  const total = await Playlist.countDocuments({ isPublic: true });
  
  res.json({
    success: true,
    data: {
      playlists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Get single playlist
router.get('/:playlistId', optionalAuth, catchAsync(async (req, res) => {
  const { playlistId } = req.params;
  
  const playlist = await Playlist.findById(playlistId)
    .populate('owner', 'username displayName avatar')
    .populate({
      path: 'tracks',
      populate: {
        path: 'artist',
        select: 'username displayName avatar'
      }
    });
  
  if (!playlist) {
    throw new AppError('Плейлист не найден в архиве', 404, 'PLAYLIST_NOT_FOUND');
  }
  
  // Check access permissions
  if (!playlist.isPublic && (!req.user || playlist.owner._id.toString() !== req.user._id.toString())) {
    throw new AppError('Доступ к плейлисту запрещён', 403, 'PLAYLIST_ACCESS_DENIED');
  }
  
  res.json({
    success: true,
    data: { playlist }
  });
}));

// Create new playlist
router.post('/', authenticateToken, catchAsync(async (req, res) => {
  const {
    name,
    description,
    isPublic = false,
    criminalTheme,
    coverImage
  } = req.body;
  
  if (!name || name.trim().length === 0) {
    throw new AppError('Название плейлиста обязательно', 400, 'MISSING_NAME');
  }
  
  const playlist = new Playlist({
    name: name.trim(),
    description,
    owner: req.user._id,
    isPublic,
    criminalTheme,
    coverImage,
    tracks: []
  });
  
  await playlist.save();
  
  await playlist.populate('owner', 'username displayName avatar');
  
  res.status(201).json({
    success: true,
    message: 'Плейлист создан и добавлен в коллекцию',
    data: { playlist }
  });
}));

// Update playlist
router.put('/:playlistId', authenticateToken, catchAsync(async (req, res) => {
  const { playlistId } = req.params;
  
  const playlist = await Playlist.findById(playlistId);
  
  if (!playlist) {
    throw new AppError('Плейлист не найден', 404, 'PLAYLIST_NOT_FOUND');
  }
  
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new AppError('Доступ запрещён', 403, 'ACCESS_DENIED');
  }
  
  const allowedFields = ['name', 'description', 'isPublic', 'criminalTheme', 'coverImage'];
  const updates = {};
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('owner', 'username displayName avatar');
  
  res.json({
    success: true,
    message: 'Плейлист обновлён',
    data: { playlist: updatedPlaylist }
  });
}));

// Add track to playlist
router.post('/:playlistId/tracks', authenticateToken, catchAsync(async (req, res) => {
  const { playlistId } = req.params;
  const { trackId } = req.body;
  
  const playlist = await Playlist.findById(playlistId);
  
  if (!playlist) {
    throw new AppError('Плейлист не найден', 404, 'PLAYLIST_NOT_FOUND');
  }
  
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new AppError('Доступ запрещён', 403, 'ACCESS_DENIED');
  }
  
  if (playlist.tracks.includes(trackId)) {
    throw new AppError('Трек уже есть в плейлисте', 400, 'TRACK_ALREADY_EXISTS');
  }
  
  playlist.tracks.push(trackId);
  await playlist.save();
  
  res.json({
    success: true,
    message: 'Трек добавлен в плейлист',
    data: { 
      playlistId: playlist._id,
      trackCount: playlist.tracks.length
    }
  });
}));

// Remove track from playlist
router.delete('/:playlistId/tracks/:trackId', authenticateToken, catchAsync(async (req, res) => {
  const { playlistId, trackId } = req.params;
  
  const playlist = await Playlist.findById(playlistId);
  
  if (!playlist) {
    throw new AppError('Плейлист не найден', 404, 'PLAYLIST_NOT_FOUND');
  }
  
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new AppError('Доступ запрещён', 403, 'ACCESS_DENIED');
  }
  
  playlist.tracks.pull(trackId);
  await playlist.save();
  
  res.json({
    success: true,
    message: 'Трек удалён из плейлиста',
    data: { 
      playlistId: playlist._id,
      trackCount: playlist.tracks.length
    }
  });
}));

// Reorder tracks in playlist
router.put('/:playlistId/reorder', authenticateToken, catchAsync(async (req, res) => {
  const { playlistId } = req.params;
  const { trackOrder } = req.body; // Array of track IDs in new order
  
  const playlist = await Playlist.findById(playlistId);
  
  if (!playlist) {
    throw new AppError('Плейлист не найден', 404, 'PLAYLIST_NOT_FOUND');
  }
  
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new AppError('Доступ запрещён', 403, 'ACCESS_DENIED');
  }
  
  if (!Array.isArray(trackOrder)) {
    throw new AppError('Неверный формат порядка треков', 400, 'INVALID_TRACK_ORDER');
  }
  
  // Validate that all tracks in trackOrder exist in the playlist
  const validTracks = trackOrder.filter(trackId => 
    playlist.tracks.some(existingTrack => existingTrack.toString() === trackId)
  );
  
  playlist.tracks = validTracks;
  await playlist.save();
  
  res.json({
    success: true,
    message: 'Порядок треков обновлён',
    data: { 
      playlistId: playlist._id,
      newOrder: validTracks
    }
  });
}));

// Delete playlist
router.delete('/:playlistId', authenticateToken, catchAsync(async (req, res) => {
  const { playlistId } = req.params;
  
  const playlist = await Playlist.findById(playlistId);
  
  if (!playlist) {
    throw new AppError('Плейлист не найден', 404, 'PLAYLIST_NOT_FOUND');
  }
  
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new AppError('Доступ запрещён', 403, 'ACCESS_DENIED');
  }
  
  await Playlist.findByIdAndDelete(playlistId);
  
  res.json({
    success: true,
    message: 'Плейлист удалён из коллекции'
  });
}));

// Follow/unfollow public playlist
router.post('/:playlistId/follow', authenticateToken, catchAsync(async (req, res) => {
  const { playlistId } = req.params;
  
  const playlist = await Playlist.findById(playlistId);
  
  if (!playlist) {
    throw new AppError('Плейлист не найден', 404, 'PLAYLIST_NOT_FOUND');
  }
  
  if (!playlist.isPublic) {
    throw new AppError('Нельзя подписаться на приватный плейлист', 400, 'PRIVATE_PLAYLIST');
  }
  
  if (playlist.owner.toString() === req.user._id.toString()) {
    throw new AppError('Нельзя подписаться на собственный плейлист', 400, 'OWN_PLAYLIST');
  }
  
  // For simplicity, we'll track this in user's saved playlists
  // In a more complex implementation, you'd have a separate followers collection
  
  playlist.stats.followers += 1;
  await playlist.save();
  
  res.json({
    success: true,
    message: 'Подписка на плейлист оформлена',
    data: { followers: playlist.stats.followers }
  });
}));

module.exports = router;
