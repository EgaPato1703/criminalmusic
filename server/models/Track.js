const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  // Basic track info
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Artist info
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  artistName: {
    type: String,
    required: true
  },
  
  // File information
  audioFile: {
    url: {
      type: String,
      required: true
    },
    publicId: String, // For cloud storage
    size: Number, // File size in bytes
    duration: Number, // Duration in seconds
    format: String, // mp3, wav, etc
    bitrate: Number,
    sampleRate: Number
  },
  
  // Cover art
  coverArt: {
    url: String,
    publicId: String,
    thumbnail: String // Smaller version for lists
  },
  
  // Criminal theme metadata
  criminalMetadata: {
    moodTags: [{
      type: String,
      enum: ['rage', 'anger', 'fight', 'hardcore', 'sad', 'rain', 'lonely', 'blues', 
             'love', 'romance', 'passion', 'heart', 'mystery', 'dark', 'secret', 
             'underground', 'energy', 'run', 'fast', 'adrenaline']
    }],
    atmosphere: {
      type: String,
      enum: ['street', 'underground', 'prison', 'night', 'chase', 'betrayal', 'revenge']
    },
    intensity: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    territory: String, // Which part of the city this track represents
    story: String // Background story of the track
  },
  
  // Album association
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album'
  },
  trackNumber: Number,
  
  // Genre and categorization
  genre: {
    type: String,
    required: true,
    index: true
  },
  subGenres: [String],
  language: {
    type: String,
    default: 'ru'
  },
  
  // Engagement metrics
  stats: {
    plays: {
      type: Number,
      default: 0,
      index: true
    },
    likes: {
      type: Number,
      default: 0,
      index: true
    },
    comments: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    }
  },
  
  // Monetization
  pricing: {
    isFree: {
      type: Boolean,
      default: true
    },
    price: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'TON'
    }
  },
  
  // Visibility and access
  visibility: {
    type: String,
    enum: ['public', 'unlisted', 'private'],
    default: 'public',
    index: true
  },
  isExplicit: {
    type: Boolean,
    default: false
  },
  
  // Release information
  releaseDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  isReleased: {
    type: Boolean,
    default: true
  },
  
  // Quality and processing
  audioQuality: {
    type: String,
    enum: ['low', 'medium', 'high', 'lossless'],
    default: 'medium'
  },
  processingStatus: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'completed'
  },
  
  // Moderation
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  moderationNotes: String,
  flagged: {
    count: { type: Number, default: 0 },
    reasons: [String],
    lastFlagged: Date
  },
  
  // Analytics
  analytics: {
    uniqueListeners: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 }, // Percentage of track completed on average
    skipRate: { type: Number, default: 0 },
    repeatRate: { type: Number, default: 0 },
    peakListeners: { type: Number, default: 0 },
    geographicData: [{
      country: String,
      plays: Number
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
trackSchema.index({ artist: 1, createdAt: -1 });
trackSchema.index({ genre: 1, 'stats.plays': -1 });
trackSchema.index({ 'criminalMetadata.moodTags': 1 });
trackSchema.index({ releaseDate: -1, visibility: 1 });
trackSchema.index({ 'stats.likes': -1, visibility: 1 });
trackSchema.index({ title: 'text', description: 'text', artistName: 'text' });

// Virtual for formatted duration
trackSchema.virtual('formattedDuration').get(function() {
  if (!this.audioFile.duration) return '0:00';
  const minutes = Math.floor(this.audioFile.duration / 60);
  const seconds = Math.floor(this.audioFile.duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for file size in MB
trackSchema.virtual('fileSizeMB').get(function() {
  if (!this.audioFile.size) return 0;
  return Math.round(this.audioFile.size / (1024 * 1024) * 100) / 100;
});

// Virtual for dominant mood
trackSchema.virtual('dominantMood').get(function() {
  if (!this.criminalMetadata.moodTags.length) return 'unknown';
  return this.criminalMetadata.moodTags[0];
});

// Methods
trackSchema.methods.incrementPlays = function() {
  this.stats.plays += 1;
  this.analytics.uniqueListeners += 1; // Simplified - in real app, track unique users
  return this.save();
};

trackSchema.methods.addLike = function() {
  this.stats.likes += 1;
  return this.save();
};

trackSchema.methods.removeLike = function() {
  this.stats.likes = Math.max(0, this.stats.likes - 1);
  return this.save();
};

trackSchema.methods.addComment = function() {
  this.stats.comments += 1;
  return this.save();
};

trackSchema.methods.flag = function(reason) {
  this.flagged.count += 1;
  this.flagged.reasons.push(reason);
  this.flagged.lastFlagged = new Date();
  return this.save();
};

// Static methods
trackSchema.statics.getByMood = function(moodTags, limit = 20) {
  return this.find({
    'criminalMetadata.moodTags': { $in: moodTags },
    visibility: 'public',
    moderationStatus: 'approved'
  })
  .populate('artist', 'username artistProfile avatar')
  .sort({ 'stats.plays': -1, createdAt: -1 })
  .limit(limit);
};

trackSchema.statics.getTrending = function(limit = 10, timeframe = 7) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - timeframe);
  
  return this.find({
    visibility: 'public',
    moderationStatus: 'approved',
    createdAt: { $gte: dateThreshold }
  })
  .populate('artist', 'username artistProfile avatar')
  .sort({ 'stats.likes': -1, 'stats.plays': -1 })
  .limit(limit);
};

trackSchema.statics.searchTracks = function(query, filters = {}) {
  const searchQuery = {
    $text: { $search: query },
    visibility: 'public',
    moderationStatus: 'approved'
  };
  
  if (filters.genre) searchQuery.genre = filters.genre;
  if (filters.moodTags) searchQuery['criminalMetadata.moodTags'] = { $in: filters.moodTags };
  if (filters.artist) searchQuery.artist = filters.artist;
  
  return this.find(searchQuery)
    .populate('artist', 'username artistProfile avatar')
    .sort({ score: { $meta: 'textScore' }, 'stats.plays': -1 });
};

// Pre-save middleware
trackSchema.pre('save', function(next) {
  // Auto-approve tracks for now (in production, implement proper moderation)
  if (this.isNew && this.moderationStatus === 'pending') {
    this.moderationStatus = 'approved';
  }
  next();
});

module.exports = mongoose.model('Track', trackSchema);

