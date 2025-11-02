const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['financial', 'client', 'sales', 'operational', 'custom'],
    required: true
  },
  filters: {
    dateRange: {
      start: Date,
      end: Date
    },
    departments: [String],
    clients: [String],
    metrics: [String]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schedule: {
    frequency: {
      type: String,
      enum: ['once', 'daily', 'weekly', 'monthly', 'quarterly'],
      default: 'once'
    },
    nextRun: Date,
    recipients: [String]
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  data: mongoose.Schema.Types.Mixed, // Store report data snapshot
  lastGenerated: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);