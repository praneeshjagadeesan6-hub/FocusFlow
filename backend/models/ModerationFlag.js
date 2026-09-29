const mongoose = require('mongoose');

const moderationFlagSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      default: '',
    },
    sourceType: {
      type: String,
      enum: ['group_post', 'resource', 'chat', 'general'],
      default: 'general',
    },
    content: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      default: 'AI safety review',
    },
    riskScore: {
      type: Number,
      default: 0,
    },
    aiStatus: {
      type: String,
      enum: ['Safe', 'Warning', 'Watchlist', 'Flagged'],
      default: 'Safe',
    },
    status: {
      type: String,
      enum: ['pending', 'warned', 'dismissed', 'safe'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ModerationFlag', moderationFlagSchema);
