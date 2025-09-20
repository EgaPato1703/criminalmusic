const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  // Content
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  
  // References
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  track: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track',
    required: true,
    index: true
  },
  
  // Criminal theme styling
  graffiti: {
    style: {
      type: String,
      enum: ['wall', 'subway', 'prison', 'street'],
      default: 'wall'
    },
    color: {
      type: String,
      default: '#00FFFF' // neon blue
    }
  },
  
  // Reply system
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  replyCount: {
    type: Number,
    default: 0
  },
  
  // Engagement
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Moderation
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  flagged: {
    count: { type: Number, default: 0 },
    reasons: [String]
  },
  moderationStatus: {
    type: String,
    enum: ['approved', 'pending', 'rejected'],
    default: 'approved'
  }
}, {
  timestamps: true
});

// Indexes
commentSchema.index({ track: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });

// Methods
commentSchema.methods.addLike = function(userId) {
  if (!this.likedBy.includes(userId)) {
    this.likedBy.push(userId);
    this.likes += 1;
  }
  return this.save();
};

commentSchema.methods.removeLike = function(userId) {
  this.likedBy.pull(userId);
  this.likes = Math.max(0, this.likes - 1);
  return this.save();
};

commentSchema.methods.addReply = function(replyId) {
  this.replies.push(replyId);
  this.replyCount += 1;
  return this.save();
};

module.exports = mongoose.model('Comment', commentSchema);

