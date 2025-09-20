const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
  // Basic album info
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
  
  // Cover art
  coverArt: {
    url: String,
    publicId: String,
    thumbnail: String
  },
  
  // Criminal theme
  criminalTheme: {
    story: String, // Album's criminal story/concept
    territory: String, // Which part of the criminal world
    era: String, // Time period (90s, 2000s, modern)
    mood: {
      type: String,
      enum: ['dark', 'aggressive', 'melancholic', 'mysterious', 'energetic']
    }
  },
  
  // Album details
  genre: {
    type: String,
    required: true
  },
  subGenres: [String],
  
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
  
  // Tracks
  tracks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track'
  }],
  totalTracks: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: Number,
    default: 0 // in seconds
  },
  
  // Visibility and access
  visibility: {
    type: String,
    enum: ['public', 'unlisted', 'private'],
    default: 'public',
    index: true
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
  
  // Statistics
  stats: {
    plays: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    saves: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    }
  },
  
  // Moderation
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  moderationNotes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
albumSchema.index({ artist: 1, createdAt: -1 });
albumSchema.index({ genre: 1, 'stats.plays': -1 });
albumSchema.index({ releaseDate: -1, visibility: 1 });
albumSchema.index({ title: 'text', description: 'text', artistName: 'text' });

// Virtual for formatted total duration
albumSchema.virtual('formattedDuration').get(function() {
  if (!this.totalDuration) return '0:00';
  const hours = Math.floor(this.totalDuration / 3600);
  const minutes = Math.floor((this.totalDuration % 3600) / 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:00`;
  }
  return `${minutes}:00`;
});

// Methods
albumSchema.methods.addTrack = function(trackId) {
  if (!this.tracks.includes(trackId)) {
    this.tracks.push(trackId);
    this.totalTracks += 1;
  }
  return this.save();
};

albumSchema.methods.removeTrack = function(trackId) {
  this.tracks.pull(trackId);
  this.totalTracks = Math.max(0, this.totalTracks - 1);
  return this.save();
};

albumSchema.methods.updateStats = async function() {
  const Track = mongoose.model('Track');
  const tracks = await Track.find({ _id: { $in: this.tracks } });
  
  this.totalDuration = tracks.reduce((sum, track) => sum + (track.audioFile.duration || 0), 0);
  this.stats.plays = tracks.reduce((sum, track) => sum + track.stats.plays, 0);
  this.stats.likes = tracks.reduce((sum, track) => sum + track.stats.likes, 0);
  
  return this.save();
};

// Static methods
albumSchema.statics.getByArtist = function(artistId) {
  return this.find({ artist: artistId, visibility: 'public' })
    .populate('tracks')
    .sort({ releaseDate: -1 });
};

albumSchema.statics.getFeatured = function(limit = 10) {
  return this.find({
    visibility: 'public',
    moderationStatus: 'approved'
  })
  .populate('artist', 'username artistProfile avatar')
  .sort({ 'stats.plays': -1, 'stats.likes': -1 })
  .limit(limit);
};

module.exports = mongoose.model('Album', albumSchema);

