const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: String,
  industry: String,
  contractValue: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  healthScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 75
  },
  slaCompliance: {
    type: Number,
    min: 0,
    max: 100,
    default: 95
  },
  satisfactionScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 80
  },
  monthlyRevenue: Number,
  costToServe: Number,
  tags: [String]
}, {
  timestamps: true
});

clientSchema.virtual('profitability').get(function() {
  return this.monthlyRevenue - this.costToServe;
});

module.exports = mongoose.model('Client', clientSchema);