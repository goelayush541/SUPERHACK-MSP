const express = require('express');
const { protect } = require('../middleware/auth');
const Client = require('../models/Client');
const FinancialData = require('../models/FinancialData');
const SoftwareLicense = require('../models/SoftwareLicense');

const router = express.Router();

// @desc    Get comprehensive business analytics
// @route   GET /api/analytics/business
// @access  Private
router.get('/business', protect, async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Revenue analytics
    const revenueAnalytics = await FinancialData.aggregate([
      {
        $match: {
          month: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$month' },
            month: { $month: '$month' }
          },
          revenue: { $sum: '$revenue' },
          costs: { $sum: '$operationalCosts' },
          profit: { $sum: { $subtract: ['$revenue', '$operationalCosts'] } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Client analytics
    const clientAnalytics = await Client.aggregate([
      {
        $facet: {
          statusDistribution: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalRevenue: { $sum: '$monthlyRevenue' }
              }
            }
          ],
          industryBreakdown: [
            {
              $group: {
                _id: '$industry',
                count: { $sum: 1 },
                avgHealthScore: { $avg: '$healthScore' },
                totalRevenue: { $sum: '$monthlyRevenue' }
              }
            }
          ],
          healthMetrics: [
            {
              $group: {
                _id: null,
                avgHealthScore: { $avg: '$healthScore' },
                avgSLACompliance: { $avg: '$slaCompliance' },
                highRiskClients: {
                  $sum: { $cond: [{ $lt: ['$healthScore', 60] }, 1, 0] }
                },
                topPerformers: {
                  $sum: { $cond: [{ $gte: ['$healthScore', 90] }, 1, 0] }
                }
              }
            }
          ]
        }
      }
    ]);

    // Profitability analysis
    const profitabilityAnalysis = await Client.aggregate([
      {
        $match: {
          monthlyRevenue: { $gt: 0 }
        }
      },
      {
        $project: {
          name: 1,
          monthlyRevenue: 1,
          costToServe: 1,
          profitability: { $subtract: ['$monthlyRevenue', '$costToServe'] },
          margin: {
            $multiply: [
              { $divide: [
                { $subtract: ['$monthlyRevenue', '$costToServe'] },
                '$monthlyRevenue'
              ]},
              100
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$monthlyRevenue' },
          totalProfit: { $sum: '$profitability' },
          avgMargin: { $avg: '$margin' },
          highlyProfitable: {
            $sum: { $cond: [{ $gte: ['$margin', 30] }, 1, 0] }
          },
          lowProfitability: {
            $sum: { $cond: [{ $lt: ['$margin', 15] }, 1, 0] }
          }
        }
      }
    ]);

    // Growth metrics
    const currentDate = new Date();
    const threeMonthsAgo = new Date(currentDate.setMonth(currentDate.getMonth() - 3));
    
    const growthMetrics = await FinancialData.aggregate([
      {
        $match: {
          month: { $gte: threeMonthsAgo }
        }
      },
      {
        $group: {
          _id: null,
          revenueGrowth: {
            $avg: {
              $cond: [
                { $gt: ['$revenue', 0] },
                { $multiply: [
                  { $divide: [
                    { $subtract: ['$revenue', '$operationalCosts'] },
                    '$revenue'
                  ]},
                  100
                ]},
                0
              ]
            }
          },
          clientGrowth: {
            $avg: '$revenue'
          }
        }
      }
    ]);

    res.json({
      revenueTrend: revenueAnalytics,
      clientInsights: clientAnalytics[0],
      profitability: profitabilityAnalysis[0] || {},
      growth: growthMetrics[0] || {},
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get predictive analytics
// @route   GET /api/analytics/predictive
// @access  Private
router.get('/predictive', protect, async (req, res) => {
  try {
    // Churn prediction (simplified)
    const churnPrediction = await Client.aggregate([
      {
        $project: {
          name: 1,
          healthScore: 1,
          slaCompliance: 1,
          satisfactionScore: 1,
          churnRisk: {
            $add: [
              { $multiply: [{ $subtract: [100, '$healthScore'] }, 0.4] },
              { $multiply: [{ $subtract: [100, '$slaCompliance'] }, 0.3] },
              { $multiply: [{ $subtract: [100, '$satisfactionScore'] }, 0.3] }
            ]
          }
        }
      },
      {
        $match: {
          churnRisk: { $gt: 30 }
        }
      },
      {
        $sort: { churnRisk: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Revenue forecasting (simplified linear projection)
    const lastSixMonths = await FinancialData.aggregate([
      {
        $sort: { month: -1 }
      },
      {
        $limit: 6
      },
      {
        $group: {
          _id: null,
          avgRevenue: { $avg: '$revenue' },
          avgGrowth: {
            $avg: {
              $cond: [
                { $gt: ['$revenue', 0] },
                { $multiply: [
                  { $divide: [
                    { $subtract: ['$revenue', '$operationalCosts'] },
                    '$revenue'
                  ]},
                  100
                ]},
                0
              ]
            }
          }
        }
      }
    ]);

    const forecast = lastSixMonths[0] ? {
      nextMonth: lastSixMonths[0].avgRevenue * 1.05, // 5% growth
      nextQuarter: lastSixMonths[0].avgRevenue * 1.15, // 15% growth
      growthRate: lastSixMonths[0].avgGrowth
    } : {};

    // Opportunity identification
    const growthOpportunities = await Client.aggregate([
      {
        $match: {
          healthScore: { $gte: 80 },
          status: 'active'
        }
      },
      {
        $project: {
          name: 1,
          healthScore: 1,
          monthlyRevenue: 1,
          upsellPotential: {
            $multiply: ['$monthlyRevenue', 0.3] // 30% upsell potential
          },
          opportunityScore: {
            $add: [
              { $multiply: ['$healthScore', 0.6] },
              { $multiply: [
                { $divide: ['$monthlyRevenue', 1000] },
                0.4
              ]}
            ]
          }
        }
      },
      {
        $sort: { opportunityScore: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      churnRisks: churnPrediction,
      revenueForecast: forecast,
      growthOpportunities
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;