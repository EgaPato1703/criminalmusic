const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Telegram integration
  telegramId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  firstName: String,
  lastName: String,
  
  // User role and profile
  role: {
    type: String,
    enum: ['listener', 'artist'],
    required: true,
    default: 'listener'
  },
  
  // Artist-specific fields
  artistProfile: {
    pseudonym: {
      type: String,
      trim: true,
      maxlength: 100
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100
    },
    genre: {
      type: String,
      trim: true,
      maxlength: 50
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  
  // Profile customization
  avatar: {
    url: String,
    publicId: String // For cloud storage
  },
  bio: {
    type: String,
    maxlength: 200,
    trim: true
  },
  status: {
    type: String,
    maxlength: 100,
    trim: true
  },
  
  // Criminal theme customization
  criminalTheme: {
    nickname: String, // Criminal nickname
    territory: String, // Street/area
    reputation: {
      type: Number,
      default: 0,
      min: 0
    },
    badges: [{
      name: String,
      icon: String,
      description: String,
      unlockedAt: Date
    }]
  },
  
  // Statistics
  stats: {
    tracksUploaded: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    totalPlays: {
      type: Number,
      default: 0
    },
    followers: {
      type: Number,
      default: 0
    },
    following: {
      type: Number,
      default: 0
    }
  },
  
  // User preferences
  preferences: {
    autoPlay: {
      type: Boolean,
      default: true
    },
    notifications: {
      newFollowers: { type: Boolean, default: true },
      newLikes: { type: Boolean, default: true },
      newComments: { type: Boolean, default: true },
      newTracks: { type: Boolean, default: true }
    },
    theme: {
      type: String,
      enum: ['dark', 'neon', 'blood'],
      default: 'dark'
    },
    language: {
      type: String,
      default: 'ru'
    }
  },
  
  // Collections and interactions
  likedTracks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track'
  }],
  savedAlbums: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album'
  }],
  followedArtists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Activity tracking
  lastActive: {
    type: Date,
    default: Date.now
  },
  lastTrackPlayed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track'
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  
  // Security and moderation
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: String,
  warnings: [{
    reason: String,
    date: Date,
    moderator: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ role: 1 });
userSchema.index({ 'artistProfile.genre': 1 });
userSchema.index({ 'stats.totalLikes': -1 });
userSchema.index({ 'stats.followers': -1 });
userSchema.index({ lastActive: -1 });

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  if (this.role === 'artist' && this.artistProfile.pseudonym) {
    return this.artistProfile.pseudonym;
  }
  return this.username || this.firstName || 'Anonymous';
});

// Virtual for reputation level
userSchema.virtual('reputationLevel').get(function() {
  const rep = this.criminalTheme.reputation;
  if (rep < 100) return 'Новичок';
  if (rep < 500) return 'Уличный';
  if (rep < 1000) return 'Авторитет';
  if (rep < 2500) return 'Босс района';
  return 'Крёстный отец';
});

// Methods
userSchema.methods.addReputation = function(points) {
  this.criminalTheme.reputation += points;
  return this.save();
};

userSchema.methods.follow = function(userId) {
  if (!this.followedArtists.includes(userId)) {
    this.followedArtists.push(userId);
    this.stats.following += 1;
  }
  return this.save();
};

userSchema.methods.unfollow = function(userId) {
  this.followedArtists.pull(userId);
  this.stats.following = Math.max(0, this.stats.following - 1);
  return this.save();
};

userSchema.methods.likeTrack = function(trackId) {
  if (!this.likedTracks.includes(trackId)) {
    this.likedTracks.push(trackId);
  }
  return this.save();
};

userSchema.methods.unlikeTrack = function(trackId) {
  this.likedTracks.pull(trackId);
  return this.save();
};

// Static methods
userSchema.statics.findByTelegramId = function(telegramId) {
  return this.findOne({ telegramId });
};

userSchema.statics.getTopArtists = function(limit = 10) {
  return this.find({ role: 'artist' })
    .sort({ 'stats.followers': -1, 'stats.totalLikes': -1 })
    .limit(limit)
    .select('username artistProfile stats avatar');
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);

