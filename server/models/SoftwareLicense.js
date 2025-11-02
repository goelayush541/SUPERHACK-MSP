const mongoose = require('mongoose');

const softwareLicenseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  vendor: String,
  cost: {
    type: Number,
    required: true
  },
  users: Number,
  utilization: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  renewalDate: Date,
  department: String,
  status: {
    type: String,
    enum: ['active', 'expired', 'pending_renewal'],
    default: 'active'
  },
  category: String
}, {
  timestamps: true
});

module.exports = mongoose.model('SoftwareLicense', softwareLicenseSchema);