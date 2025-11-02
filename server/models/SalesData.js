const mongoose = require('mongoose');

const salesDataSchema = new mongoose.Schema({
  opportunityName: {
    type: String,
    required: true
  },
  clientName: String,
  value: {
    type: Number,
    required: true
  },
  stage: {
    type: String,
    enum: ['prospect', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'prospect'
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  expectedCloseDate: Date,
  salesRep: String,
  department: String,
  source: String,
  notes: String,
  lostReason: String
}, {
  timestamps: true
});

// Virtual for weighted pipeline value
salesDataSchema.virtual('weightedValue').get(function() {
  return this.value * (this.probability / 100);
});

module.exports = mongoose.model('SalesData', salesDataSchema);