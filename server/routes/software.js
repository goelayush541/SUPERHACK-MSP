const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const SoftwareLicense = require('../models/SoftwareLicense');

const router = express.Router();

// @desc    Get all software licenses
// @route   GET /api/software
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, department } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (department) query.department = department;

    const licenses = await SoftwareLicense.find(query)
      .sort({ renewalDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SoftwareLicense.countDocuments(query);

    res.json({
      licenses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get software analytics
// @route   GET /api/software/analytics
// @access  Private
router.get('/analytics', protect, async (req, res) => {
  try {
    const totalCost = await SoftwareLicense.aggregate([
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$cost' },
          avgUtilization: { $avg: '$utilization' },
          underutilizedCount: {
            $sum: {
              $cond: [{ $lt: ['$utilization', 50] }, 1, 0]
            }
          },
          expiringSoonCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $ne: ['$renewalDate', null] },
                    { $lt: ['$renewalDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const costByDepartment = await SoftwareLicense.aggregate([
      {
        $group: {
          _id: '$department',
          totalCost: { $sum: '$cost' },
          licenseCount: { $sum: 1 },
          avgUtilization: { $avg: '$utilization' }
        }
      }
    ]);

    const utilizationDistribution = await SoftwareLicense.aggregate([
      {
        $bucket: {
          groupBy: '$utilization',
          boundaries: [0, 25, 50, 75, 101],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            totalCost: { $sum: '$cost' }
          }
        }
      }
    ]);

    res.json({
      overview: totalCost[0] || {
        totalCost: 0,
        avgUtilization: 0,
        underutilizedCount: 0,
        expiringSoonCount: 0
      },
      costByDepartment,
      utilizationDistribution
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add software license
// @route   POST /api/software
// @access  Private
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const license = await SoftwareLicense.create(req.body);
    res.status(201).json(license);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update software license
// @route   PUT /api/software/:id
// @access  Private
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const license = await SoftwareLicense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!license) {
      return res.status(404).json({ message: 'Software license not found' });
    }

    res.json(license);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get cost optimization recommendations
// @route   GET /api/software/recommendations
// @access  Private
router.get('/recommendations', protect, async (req, res) => {
  try {
    // Find underutilized licenses
    const underutilized = await SoftwareLicense.find({
      utilization: { $lt: 50 }
    }).sort({ cost: -1 }).limit(5);

    // Find licenses expiring soon
    const expiringSoon = await SoftwareLicense.find({
      renewalDate: { 
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        $gte: new Date()
      }
    }).sort({ renewalDate: 1 });

    // High cost, low utilization licenses
    const costInefficient = await SoftwareLicense.find({
      utilization: { $lt: 70 },
      cost: { $gt: 1000 }
    }).sort({ cost: -1 });

    const recommendations = [];

    underutilized.forEach(license => {
      recommendations.push({
        type: 'UNDERUTILIZED',
        severity: license.utilization < 25 ? 'HIGH' : 'MEDIUM',
        title: `Underutilized License: ${license.name}`,
        description: `Utilization is only ${license.utilization}% costing $${license.cost}/month`,
        suggestion: 'Consider downgrading license tier or reallocating licenses',
        licenseId: license._id,
        potentialSavings: Math.round(license.cost * (1 - (license.utilization / 100)))
      });
    });

    expiringSoon.forEach(license => {
      recommendations.push({
        type: 'RENEWAL',
        severity: 'MEDIUM',
        title: `License Expiring: ${license.name}`,
        description: `Renews on ${license.renewalDate.toLocaleDateString()}`,
        suggestion: 'Review usage and negotiate renewal terms',
        licenseId: license._id
      });
    });

    costInefficient.forEach(license => {
      recommendations.push({
        type: 'COST_OPTIMIZATION',
        severity: 'HIGH',
        title: `Cost Optimization: ${license.name}`,
        description: `High cost ($${license.cost}) with moderate utilization (${license.utilization}%)`,
        suggestion: 'Research alternative solutions or negotiate better pricing',
        licenseId: license._id,
        potentialSavings: Math.round(license.cost * 0.3) // Assume 30% savings potential
      });
    });

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;