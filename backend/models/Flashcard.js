const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      default: 'General',
    },
    type: {
      type: String,
      enum: ['theory', 'mcq'],
      default: 'theory',
    },
    options: {
      type: [String],
      default: [],
    },
    correctOption: {
      type: Number,
      default: 0,
    },
    easeFactor: {
      type: Number,
      default: 2.5,
    },
    interval: {
      type: Number,
      default: 1,
    },
    nextReviewAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Flashcard', flashcardSchema);
