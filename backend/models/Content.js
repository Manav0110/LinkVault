const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  uniqueId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['text', 'file'],
    required: true
  },
  textContent: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  fileType: {
    type: String,
    default: null
  },
  filePath: {
    type: String,
    default: null
  },
  password: {
    type: String,
    default: null
  },
  oneTimeView: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  maxViews: {
    type: Number,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// TTL index — MongoDB auto-deletes the doc after expiresAt
contentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;