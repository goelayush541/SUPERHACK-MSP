const express = require('express');
const { protect } = require('../middleware/auth');
const Report = require('../models/Report');
const Client = require('../models/Client');
const FinancialData = require('../models/FinancialData');

const router = express.Router();

// @desc    Generate financial report
// @route   POST /api/reports/financial
// @access  Private
router.post('/financial', protect, async (req, res) => {
  try {
    const { startDate, endDate, departments, metrics } = req.body;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.month = {};
      if (startDate) matchStage.month.$gte = new Date(startDate);
      if (endDate) matchStage.month.$lte = new Date(endDate);
    }
    if (departments && departments.length > 0) {
      matchStage.department = { $in: departments };
    }

    const financialReport = await FinancialData.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$month' },
            month: { $month: '$month' },
            department: '$department'
          },
          revenue: { $sum: '$revenue' },
          operationalCosts: { $sum: '$operationalCosts' },
          softwareCosts: { $sum: '$softwareCosts' },
          personnelCosts: { $sum: '$personnelCosts' },
          infrastructureCosts: { $sum: '$infrastructureCosts' }
        }
      },
      {
        $project: {
          period: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: 1
            }
          },
          department: '$_id.department',
          revenue: 1,
          totalCosts: {
            $add: [
              '$operationalCosts',
              '$softwareCosts',
              '$personnelCosts',
              '$infrastructureCosts'
            ]
          },
          profit: {
            $subtract: [
              '$revenue',
              {
                $add: [
                  '$operationalCosts',
                  '$softwareCosts',
                  '$personnelCosts',
                  '$infrastructureCosts'
                ]
              }
            ]
          },
          margin: {
            $multiply: [
              {
                $cond: [
                  { $eq: ['$revenue', 0] },
                  0,
                  {
                    $divide: [
                      { $subtract: ['$revenue', '$operationalCosts'] },
                      '$revenue'
                    ]
                  }
                ]
              },
              100
            ]
          }
        }
      },
      { $sort: { period: 1, department: 1 } }
    ]);

    // Summary statistics
    const summary = await FinancialData.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$revenue' },
          totalCosts: {
            $sum: {
              $add: [
                '$operationalCosts',
                '$softwareCosts',
                '$personnelCosts',
                '$infrastructureCosts'
              ]
            }
          },
          avgMargin: {
            $avg: {
              $cond: [
                { $eq: ['$revenue', 0] },
                0,
                {
                  $multiply: [
                    {
                      $divide: [
                        { $subtract: ['$revenue', '$operationalCosts'] },
                        '$revenue'
                      ]
                    },
                    100
                  ]
                }
              ]
            }
          }
        }
      }
    ]);

    res.json({
      reportData: financialReport,
      summary: summary[0] || {},
      generatedAt: new Date(),
      parameters: req.body
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Generate client performance report
// @route   POST /api/reports/clients
// @access  Private
router.post('/clients', protect, async (req, res) => {
  try {
    const { status, minHealthScore, industries } = req.body;

    const matchStage = {};
    if (status) matchStage.status = status;
    if (minHealthScore) matchStage.healthScore = { $gte: minHealthScore };
    if (industries && industries.length > 0) {
      matchStage.industry = { $in: industries };
    }

    const clientReport = await Client.aggregate([
      { $match: matchStage },
      {
        $project: {
          name: 1,
          industry: 1,
          status: 1,
          healthScore: 1,
          slaCompliance: 1,
          satisfactionScore: 1,
          monthlyRevenue: 1,
          costToServe: 1,
          profitability: { $subtract: ['$monthlyRevenue', '$costToServe'] },
          margin: {
            $multiply: [
              {
                $cond: [
                  { $eq: ['$monthlyRevenue', 0] },
                  0,
                  {
                    $divide: [
                      { $subtract: ['$monthlyRevenue', '$costToServe'] },
                      '$monthlyRevenue'
                    ]
                  }
                ]
              },
              100
            ]
          },
          healthStatus: {
            $switch: {
              branches: [
                { case: { $gte: ['$healthScore', 80] }, then: 'Excellent' },
                { case: { $gte: ['$healthScore', 60] }, then: 'Good' },
                { case: { $gte: ['$healthScore', 40] }, then: 'Fair' }
              ],
              default: 'Poor'
            }
          }
        }
      },
      { $sort: { profitability: -1 } }
    ]);

    const summary = await Client.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalClients: { $sum: 1 },
          totalRevenue: { $sum: '$monthlyRevenue' },
          totalProfit: { $sum: { $subtract: ['$monthlyRevenue', '$costToServe'] } },
          avgHealthScore: { $avg: '$healthScore' },
          avgSLACompliance: { $avg: '$slaCompliance' }
        }
      }
    ]);

    res.json({
      clients: clientReport,
      summary: summary[0] || {},
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Save custom report
// @route   POST /api/reports
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const report = await Report.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get saved reports
// @route   GET /api/reports
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const reports = await Report.find({
      $or: [
        { createdBy: req.user.id },
        { isPublic: true }
      ]
    }).populate('createdBy', 'name email').sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;