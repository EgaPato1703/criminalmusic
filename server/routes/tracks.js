const express = require('express');
const { authenticateToken, requireArtist, optionalAuth } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const Track = require('../models/Track');
const User = require('../models/User');
const Comment = require('../models/Comment');

const router = express.Router();

// Get all tracks with filtering and pagination
router.get('/', optionalAuth, catchAsync(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    genre, 
    mood, 
    artist, 
    sort = 'recent',
    search 
  } = req.query;
  
  let query = {
    visibility: 'public',
    moderationStatus: 'approved'
  };
  
  // Apply filters
  if (genre) query.genre = genre;
  if (mood) query['criminalMetadata.moodTags'] = { $in: [mood] };
  if (artist) query.artist = artist;
  if (search) {
    query.$text = { $search: search };
  }
  
  // Determine sort order
  let sortQuery = {};
  switch (sort) {
    case 'popular':
      sortQuery = { 'stats.likes': -1, 'stats.plays': -1 };
      break;
    case 'trending':
      sortQuery = { 'stats.plays': -1, createdAt: -1 };
      break;
    case 'recent':
    default:
      sortQuery = { createdAt: -1 };
      break;
  }
  
  const tracks = await Track.find(query)
    .populate('artist', 'username displayName avatar artistProfile')
    .sort(sortQuery)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
  
  const total = await Track.countDocuments(query);
  
  res.json({
    success: true,
    data: {
      tracks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Get single track by ID
router.get('/:trackId', optionalAuth, catchAsync(async (req, res) => {
  const { trackId } = req.params;
  
  const track = await Track.findById(trackId)
    .populate('artist', 'username displayName avatar artistProfile stats')
    .populate('album', 'title coverArt');
  
  if (!track) {
    throw new AppError('Трек не найден в архивах', 404, 'TRACK_NOT_FOUND');
  }
  
  // Check if track is accessible
  if (track.visibility === 'private' && (!req.user || track.artist._id.toString() !== req.user._id.toString())) {
    throw new AppError('Доступ к треку запрещён', 403, 'TRACK_ACCESS_DENIED');
  }
  
  // Check if current user liked this track
  let isLiked = false;
  if (req.user && req.user.likedTracks.includes(trackId)) {
    isLiked = true;
  }
  
  res.json({
    success: true,
    data: {
      track: {
        ...track.toObject(),
        isLiked
      }
    }
  });
}));

// Create new track (artists only)
router.post('/', authenticateToken, requireArtist, catchAsync(async (req, res) => {
  const {
    title,
    description,
    genre,
    subGenres,
    criminalMetadata,
    audioFile,
    coverArt,
    visibility = 'public'
  } = req.body;
  
  if (!title || !audioFile || !audioFile.url) {
    throw new AppError('Название и аудиофайл обязательны', 400, 'MISSING_REQUIRED_FIELDS');
  }
  
  const track = new Track({
    title,
    description,
    artist: req.user._id,
    artistName: req.user.displayName,
    genre,
    subGenres,
    criminalMetadata,
    audioFile,
    coverArt,
    visibility
  });
  
  await track.save();
  
  // Update artist stats
  req.user.stats.tracksUploaded += 1;
  await req.user.save();
  
  // Populate artist info for response
  await track.populate('artist', 'username displayName avatar artistProfile');
  
  // Emit real-time event to followers
  const io = req.app.get('io');
  const followers = await User.find({ followedArtists: req.user._id });
  followers.forEach(follower => {
    io.to(`user-${follower._id}`).emit('new-track', {
      track: {
        id: track._id,
        title: track.title,
        artist: track.artist,
        coverArt: track.coverArt
      }
    });
  });
  
  res.status(201).json({
    success: true,
    message: 'Трек успешно загружен в архив',
    data: { track }
  });
}));

// Update track (artist only)
router.put('/:trackId', authenticateToken, requireArtist, catchAsync(async (req, res) => {
  const { trackId } = req.params;
  
  const track = await Track.findById(trackId);
  
  if (!track) {
    throw new AppError('Трек не найден', 404, 'TRACK_NOT_FOUND');
  }
  
  if (track.artist.toString() !== req.user._id.toString()) {
    throw new AppError('Доступ запрещён', 403, 'ACCESS_DENIED');
  }
  
  const allowedFields = [
    'title', 'description', 'genre', 'subGenres', 
    'criminalMetadata', 'coverArt', 'visibility', 'pricing'
  ];
  
  const updates = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  
  const updatedTrack = await Track.findByIdAndUpdate(
    trackId,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('artist', 'username displayName avatar artistProfile');
  
  res.json({
    success: true,
    message: 'Трек обновлён',
    data: { track: updatedTrack }
  });
}));

// Delete track (artist only)
router.delete('/:trackId', authenticateToken, requireArtist, catchAsync(async (req, res) => {
  const { trackId } = req.params;
  
  const track = await Track.findById(trackId);
  
  if (!track) {
    throw new AppError('Трек не найден', 404, 'TRACK_NOT_FOUND');
  }
  
  if (track.artist.toString() !== req.user._id.toString()) {
    throw new AppError('Доступ запрещён', 403, 'ACCESS_DENIED');
  }
  
  await Track.findByIdAndDelete(trackId);
  
  // Update artist stats
  req.user.stats.tracksUploaded = Math.max(0, req.user.stats.tracksUploaded - 1);
  req.user.stats.totalLikes = Math.max(0, req.user.stats.totalLikes - track.stats.likes);
  await req.user.save();
  
  // Remove from all user collections
  await User.updateMany(
    { likedTracks: trackId },
    { $pull: { likedTracks: trackId } }
  );
  
  res.json({
    success: true,
    message: 'Трек удалён из архива'
  });
}));

// Like/unlike track
router.post('/:trackId/like', authenticateToken, catchAsync(async (req, res) => {
  const { trackId } = req.params;
  
  const track = await Track.findById(trackId);
  
  if (!track) {
    throw new AppError('Трек не найден', 404, 'TRACK_NOT_FOUND');
  }
  
  const user = req.user;
  const isLiked = user.likedTracks.includes(trackId);
  
  if (isLiked) {
    // Unlike
    await user.unlikeTrack(trackId);
    await track.removeLike();
    
    // Update artist stats
    const artist = await User.findById(track.artist);
    if (artist) {
      artist.stats.totalLikes = Math.max(0, artist.stats.totalLikes - 1);
      await artist.save();
    }
    
    res.json({
      success: true,
      message: 'Лайк убран',
      data: { isLiked: false, likes: track.stats.likes }
    });
  } else {
    // Like
    await user.likeTrack(trackId);
    await track.addLike();
    
    // Update artist stats
    const artist = await User.findById(track.artist);
    if (artist) {
      artist.stats.totalLikes += 1;
      await artist.addReputation(5); // Add reputation for likes
      await artist.save();
    }
    
    // Emit real-time event to artist
    const io = req.app.get('io');
    io.to(`user-${track.artist}`).emit('track-liked', {
      track: { id: track._id, title: track.title },
      user: { id: user._id, username: user.displayName }
    });
    
    res.json({
      success: true,
      message: 'Трек добавлен в коллекцию',
      data: { isLiked: true, likes: track.stats.likes }
    });
  }
}));

// Play track (increment play count)
router.post('/:trackId/play', optionalAuth, catchAsync(async (req, res) => {
  const { trackId } = req.params;
  
  const track = await Track.findById(trackId);
  
  if (!track) {
    throw new AppError('Трек не найден', 404, 'TRACK_NOT_FOUND');
  }
  
  await track.incrementPlays();
  
  // Update user's last played track
  if (req.user) {
    req.user.lastTrackPlayed = trackId;
    await req.user.save();
  }
  
  res.json({
    success: true,
    message: 'Воспроизведение засчитано',
    data: { plays: track.stats.plays }
  });
}));

// Get track comments
router.get('/:trackId/comments', optionalAuth, catchAsync(async (req, res) => {
  const { trackId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const comments = await Comment.find({
    track: trackId,
    isDeleted: false,
    moderationStatus: 'approved'
  })
  .populate('user', 'username displayName avatar criminalTheme')
  .populate('replies')
  .sort({ createdAt: -1 })
  .limit(parseInt(limit))
  .skip((parseInt(page) - 1) * parseInt(limit));
  
  const total = await Comment.countDocuments({
    track: trackId,
    isDeleted: false,
    moderationStatus: 'approved'
  });
  
  res.json({
    success: true,
    data: {
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Add comment to track
router.post('/:trackId/comments', authenticateToken, catchAsync(async (req, res) => {
  const { trackId } = req.params;
  const { content, parentComment, graffiti } = req.body;
  
  if (!content || content.trim().length === 0) {
    throw new AppError('Комментарий не может быть пустым', 400, 'EMPTY_COMMENT');
  }
  
  const track = await Track.findById(trackId);
  
  if (!track) {
    throw new AppError('Трек не найден', 404, 'TRACK_NOT_FOUND');
  }
  
  const comment = new Comment({
    content: content.trim(),
    user: req.user._id,
    track: trackId,
    parentComment,
    graffiti
  });
  
  await comment.save();
  await track.addComment();
  
  // If it's a reply, update parent comment
  if (parentComment) {
    const parent = await Comment.findById(parentComment);
    if (parent) {
      await parent.addReply(comment._id);
    }
  }
  
  // Populate user info
  await comment.populate('user', 'username displayName avatar criminalTheme');
  
  // Emit real-time event
  const io = req.app.get('io');
  io.to(`user-${track.artist}`).emit('new-comment', {
    track: { id: track._id, title: track.title },
    comment: {
      id: comment._id,
      content: comment.content,
      user: comment.user
    }
  });
  
  res.status(201).json({
    success: true,
    message: 'Комментарий оставлен на стене',
    data: { comment }
  });
}));

// Get trending tracks
router.get('/trending/now', catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const tracks = await Track.getTrending(parseInt(limit));
  
  res.json({
    success: true,
    data: { tracks }
  });
}));

// Get tracks by mood
router.get('/mood/:mood', optionalAuth, catchAsync(async (req, res) => {
  const { mood } = req.params;
  const { limit = 20 } = req.query;
  
  const moodTags = {
    'aggression': ['rage', 'anger', 'fight', 'hardcore'],
    'melancholy': ['sad', 'rain', 'lonely', 'blues'],
    'love': ['love', 'romance', 'passion', 'heart'],
    'mystery': ['mystery', 'dark', 'secret', 'underground'],
    'energy': ['energy', 'run', 'fast', 'adrenaline']
  };
  
  const tags = moodTags[mood];
  if (!tags) {
    throw new AppError('Неизвестное настроение', 400, 'UNKNOWN_MOOD');
  }
  
  const tracks = await Track.getByMood(tags, parseInt(limit));
  
  res.json({
    success: true,
    data: { tracks, mood }
  });
}));

module.exports = router;

