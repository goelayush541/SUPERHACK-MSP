const mongoose = require('mongoose');

const financialDataSchema = new mongoose.Schema({
  month: {
    type: Date,
    required: true
  },
  revenue: {
    type: Number,
    required: true
  },
  operationalCosts: {
    type: Number,
    required: true
  },
  softwareCosts: Number,
  personnelCosts: Number,
  infrastructureCosts: Number,
  department: {
    type: String,
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  budget: Number,
  actualSpend: Number
}, {
  timestamps: true
});

financialDataSchema.index({ month: 1, department: 1 });

module.exports = mongoose.model('FinancialData', financialDataSchema);