const express = require('express');
const { authenticateToken, requireArtist, optionalAuth } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const Album = require('../models/Album');
const Track = require('../models/Track');

const router = express.Router();

// Get all albums with filtering
router.get('/', optionalAuth, catchAsync(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    genre, 
    artist, 
    sort = 'recent' 
  } = req.query;
  
  let query = {
    visibility: 'public',
    moderationStatus: 'approved'
  };
  
  if (genre) query.genre = genre;
  if (artist) query.artist = artist;
  
  let sortQuery = {};
  switch (sort) {
    case 'popular':
      sortQuery = { 'stats.plays': -1, 'stats.likes': -1 };
      break;
    case 'recent':
    default:
      sortQuery = { releaseDate: -1 };
      break;
  }
  
  const albums = await Album.find(query)
    .populate('artist', 'username displayName avatar artistProfile')
    .sort(sortQuery)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
  
  const total = await Album.countDocuments(query);
  
  res.json({
    success: true,
    data: {
      albums,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Get single album by ID
router.get('/:albumId', optionalAuth, catchAsync(async (req, res) => {
  const { albumId } = req.params;
  
  const album = await Album.findById(albumId)
    .populate('artist', 'username displayName avatar artistProfile stats')
    .populate({
      path: 'tracks',
      populate: {
        path: 'artist',
        select: 'username displayName'
      }
    });
  
  if (!album) {
    throw new AppError('Альбом не найден в архивах', 404, 'ALBUM_NOT_FOUND');
  }
  
  if (album.visibility === 'private' && (!req.user || album.artist._id.toString() !== req.user._id.toString())) {
    throw new AppError('Доступ к альбому запрещён', 403, 'ALBUM_ACCESS_DENIED');
  }
  
  res.json({
    success: true,
    data: { album }
  });
}));

// Create new album (artists only)
router.post('/', authenticateToken, requireArtist, catchAsync(async (req, res) => {
  const {
    title,
    description,
    genre,
    subGenres,
    criminalTheme,
    coverArt,
    visibility = 'public',
    tracks = []
  } = req.body;
  
  if (!title) {
    throw new AppError('Название альбома обязательно', 400, 'MISSING_TITLE');
  }
  
  const album = new Album({
    title,
    description,
    artist: req.user._id,
    artistName: req.user.displayName,
    genre,
    subGenres,
    criminalTheme,
    coverArt,
    visibility,
    tracks,
    totalTracks: tracks.length
  });
  
  await album.save();
  
  // Update tracks to reference this album
  if (tracks.length > 0) {
    await Track.updateMany(
      { _id: { $in: tracks }, artist: req.user._id },
      { album: album._id }
    );
    
    // Update album stats
    await album.updateStats();
  }
  
  await album.populate('artist', 'username displayName avatar artistProfile');
  
  res.status(201).json({
    success: true,
    message: 'Альбом создан и добавлен в архив',
    data: { album }
  });
}));

// Update album (artist only)
router.put('/:albumId', authenticateToken, requireArtist, catchAsync(async (req, res) => {
  const { albumId } = req.params;
  
  const album = await Album.findById(albumId);
  
  if (!album) {
    throw new AppError('Альбом не найден', 404, 'ALBUM_NOT_FOUND');
  }
  
  if (album.artist.toString() !== req.user._id.toString()) {
    throw new AppError('Доступ запрещён', 403, 'ACCESS_DENIED');
  }
  
  const allowedFields = [
    'title', 'description', 'genre', 'subGenres', 
    'criminalTheme', 'coverArt', 'visibility', 'pricing'
  ];
  
  const updates = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  
  const updatedAlbum = await Album.findByIdAndUpdate(
    albumId,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('artist', 'username displayName avatar artistProfile');
  
  res.json({
    success: true,
    message: 'Альбом обновлён',
    data: { album: updatedAlbum }
  });
}));

// Add track to album
router.post('/:albumId/tracks', authenticateToken, requireArtist, catchAsync(async (req, res) => {
  const { albumId } = req.params;
  const { trackId } = req.body;
  
  const album = await Album.findById(albumId);
  const track = await Track.findById(trackId);
  
  if (!album) {
    throw new AppError('Альбом не найден', 404, 'ALBUM_NOT_FOUND');
  }
  
  if (!track) {
    throw new AppError('Трек не найден', 404, 'TRACK_NOT_FOUND');
  }
  
  if (album.artist.toString() !== req.user._id.toString() || 
      track.artist.toString() !== req.user._id.toString()) {
    throw new AppError('Доступ запрещён', 403, 'ACCESS_DENIED');
  }
  
  await album.addTrack(trackId);
  track.album = albumId;
  await track.save();
  
  await album.updateStats();
  
  res.json({
    success: true,
    message: 'Трек добавлен в альбом',
    data: { 
      albumId: album._id,
      trackId: track._id,
      totalTracks: album.totalTracks
    }
  });
}));

// Remove track from album
router.delete('/:albumId/tracks/:trackId', authenticateToken, requireArtist, catchAsync(async (req, res) => {
  const { albumId, trackId } = req.params;
  
  const album = await Album.findById(albumId);
  const track = await Track.findById(trackId);
  
  if (!album) {
    throw new AppError('Альбом не найден', 404, 'ALBUM_NOT_FOUND');
  }
  
  if (!track) {
    throw new AppError('Трек не найден', 404, 'TRACK_NOT_FOUND');
  }
  
  if (album.artist.toString() !== req.user._id.toString()) {
    throw new AppError('Доступ запрещён', 403, 'ACCESS_DENIED');
  }
  
  await album.removeTrack(trackId);
  track.album = undefined;
  await track.save();
  
  await album.updateStats();
  
  res.json({
    success: true,
    message: 'Трек удалён из альбома',
    data: { 
      albumId: album._id,
      trackId: track._id,
      totalTracks: album.totalTracks
    }
  });
}));

// Delete album (artist only)
router.delete('/:albumId', authenticateToken, requireArtist, catchAsync(async (req, res) => {
  const { albumId } = req.params;
  
  const album = await Album.findById(albumId);
  
  if (!album) {
    throw new AppError('Альбом не найден', 404, 'ALBUM_NOT_FOUND');
  }
  
  if (album.artist.toString() !== req.user._id.toString()) {
    throw new AppError('Доступ запрещён', 403, 'ACCESS_DENIED');
  }
  
  // Remove album reference from tracks
  await Track.updateMany(
    { album: albumId },
    { $unset: { album: 1 } }
  );
  
  await Album.findByIdAndDelete(albumId);
  
  res.json({
    success: true,
    message: 'Альбом удалён из архива'
  });
}));

// Get featured albums
router.get('/featured/list', catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const albums = await Album.getFeatured(parseInt(limit));
  
  res.json({
    success: true,
    data: { albums }
  });
}));

module.exports = router;

