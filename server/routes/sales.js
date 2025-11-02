const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const SalesData = require('../models/SalesData');

const router = express.Router();

// @desc    Get sales pipeline
// @route   GET /api/sales/pipeline
// @access  Private
router.get('/pipeline', protect, async (req, res) => {
  try {
    const pipeline = await SalesData.aggregate([
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' },
          weightedValue: { $sum: { $multiply: ['$value', { $divide: ['$probability', 100] }] } },
          avgProbability: { $avg: '$probability' }
        }
      }
    ]);

    const totalPipeline = await SalesData.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$value' },
          totalWeightedValue: { $sum: { $multiply: ['$value', { $divide: ['$probability', 100] }] } },
          avgProbability: { $avg: '$probability' }
        }
      }
    ]);

    res.json({
      pipeline,
      totals: totalPipeline[0] || {}
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get sales performance
// @route   GET /api/sales/performance
// @access  Private
router.get('/performance', protect, async (req, res) => {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const performance = await SalesData.aggregate([
      {
        $match: {
          createdAt: { $gte: threeMonthsAgo },
          stage: { $in: ['closed_won', 'closed_lost'] }
        }
      },
      {
        $group: {
          _id: {
            salesRep: '$salesRep',
            stage: '$stage'
          },
          count: { $sum: 1 },
          totalValue: { $sum: '$value' }
        }
      },
      {
        $group: {
          _id: '$_id.salesRep',
          won: {
            $sum: {
              $cond: [{ $eq: ['$_id.stage', 'closed_won'] }, '$totalValue', 0]
            }
          },
          lost: {
            $sum: {
              $cond: [{ $eq: ['$_id.stage', 'closed_lost'] }, '$totalValue', 0]
            }
          },
          dealCount: { $sum: '$count' }
        }
      },
      {
        $project: {
          salesRep: '$_id',
          won: 1,
          lost: 1,
          dealCount: 1,
          winRate: {
            $cond: [
              { $eq: ['$dealCount', 0] },
              0,
              { $multiply: [
                { $divide: [
                  { $size: { $ifNull: ['$won', []] } },
                  '$dealCount'
                ]},
                100
              ]}
            ]
          }
        }
      }
    ]);

    // Conversion rates by stage
    const conversionRates = await SalesData.aggregate([
      {
        $facet: {
          stageCounts: [
            {
              $group: {
                _id: '$stage',
                count: { $sum: 1 }
              }
            }
          ],
          timeInStage: [
            {
              $project: {
                stage: 1,
                daysInStage: {
                  $divide: [
                    { $subtract: [new Date(), '$createdAt'] },
                    1000 * 60 * 60 * 24
                  ]
                }
              }
            },
            {
              $group: {
                _id: '$stage',
                avgDays: { $avg: '$daysInStage' }
              }
            }
          ]
        }
      }
    ]);

    res.json({
      repPerformance: performance,
      conversionRates: conversionRates[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create sales opportunity
// @route   POST /api/sales/opportunities
// @access  Private
router.post('/opportunities', protect, authorize('admin', 'manager', 'sales_agent'), async (req, res) => {
  try {
    const opportunity = await SalesData.create(req.body);
    res.status(201).json(opportunity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get all opportunities
// @route   GET /api/sales/opportunities
// @access  Private
router.get('/opportunities', protect, async (req, res) => {
  try {
    const { stage, salesRep, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (stage) query.stage = stage;
    if (salesRep) query.salesRep = salesRep;

    const opportunities = await SalesData.find(query)
      .sort({ expectedCloseDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SalesData.countDocuments(query);

    res.json({
      opportunities,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;