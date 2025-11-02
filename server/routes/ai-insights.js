const express = require('express');
const { protect } = require('../middleware/auth');
const Client = require('../models/Client');
const FinancialData = require('../models/FinancialData');
const SoftwareLicense = require('../models/SoftwareLicense');

const router = express.Router();

// @desc    Get AI-powered business insights
// @route   GET /api/ai-insights/business
// @access  Private
router.get('/business', protect, async (req, res) => {
  try {
    // Analyze client health trends
    const clientHealthInsights = await Client.aggregate([
      {
        $group: {
          _id: null,
          avgHealth: { $avg: '$healthScore' },
          trend: {
            $avg: {
              $cond: [
                { $gte: ['$healthScore', 80] },
                1,
                { $cond: [{ $gte: ['$healthScore', 60] }, 0, -1] }
              ]
            }
          },
          riskFactors: {
            $push: {
              $cond: [
                { $lt: ['$healthScore', 60] },
                {
                  client: '$name',
                  score: '$healthScore',
                  issues: ['Low health score']
                },
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          avgHealth: 1,
          trend: 1,
          riskFactors: {
            $filter: {
              input: '$riskFactors',
              as: 'factor',
              cond: { $ne: ['$$factor', null] }
            }
          }
        }
      }
    ]);

    // Cost optimization insights
    const costInsights = await SoftwareLicense.aggregate([
      {
        $match: {
          utilization: { $lt: 50 },
          cost: { $gt: 100 }
        }
      },
      {
        $group: {
          _id: null,
          totalWaste: { $sum: { $multiply: ['$cost', { $subtract: [1, { $divide: ['$utilization', 100] }] }] } },
          opportunities: {
            $push: {
              software: '$name',
              currentUtilization: '$utilization',
              monthlyCost: '$cost',
              potentialSavings: { $multiply: ['$cost', { $subtract: [1, { $divide: ['$utilization', 100] }] }] },
              recommendation: 'Consider license downgrade or reallocation'
            }
          }
        }
      }
    ]);

    // Revenue growth opportunities
    const growthInsights = await Client.aggregate([
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
          upsellPotential: { $multiply: ['$monthlyRevenue', 0.3] },
          growthScore: {
            $add: [
              { $multiply: ['$healthScore', 0.6] },
              { $multiply: [{ $divide: ['$monthlyRevenue', 10000] }, 0.4] }
            ]
          }
        }
      },
      {
        $sort: { growthScore: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Predictive maintenance insights
    const predictiveInsights = await FinancialData.aggregate([
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
          revenueTrend: {
            $avg: {
              $cond: [
                { $gt: ['$revenue', 0] },
                { $divide: [
                  { $subtract: ['$revenue', '$operationalCosts'] },
                  '$revenue'
                ]},
                0
              ]
            }
          },
          forecast: {
            $avg: {
              $add: [
                '$revenue',
                { $multiply: ['$revenue', 0.05] } // 5% growth assumption
              ]
            }
          }
        }
      }
    ]);

    res.json({
      clientHealth: clientHealthInsights[0] || {},
      costOptimization: costInsights[0] || { totalWaste: 0, opportunities: [] },
      growthOpportunities: growthInsights,
      predictiveAnalytics: predictiveInsights[0] || {}
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get automated recommendations
// @route   GET /api/ai-insights/recommendations
// @access  Private
router.get('/recommendations', protect, async (req, res) => {
  try {
    const recommendations = [];

    // Client retention recommendations
    const atRiskClients = await Client.find({
      healthScore: { $lt: 60 },
      status: 'active'
    }).limit(5);

    atRiskClients.forEach(client => {
      recommendations.push({
        type: 'CLIENT_RETENTION',
        priority: 'HIGH',
        title: `Client at Risk: ${client.name}`,
        description: `Health score of ${client.healthScore}% indicates potential churn risk`,
        action: 'Schedule health check and review service delivery',
        impact: 'High',
        estimatedValue: client.monthlyRevenue || 0
      });
    });

    // Cost saving recommendations
    const wastefulLicenses = await SoftwareLicense.find({
      utilization: { $lt: 40 },
      cost: { $gt: 500 }
    }).limit(3);

    wastefulLicenses.forEach(license => {
      recommendations.push({
        type: 'COST_SAVING',
        priority: 'MEDIUM',
        title: `Underutilized License: ${license.name}`,
        description: `Only ${license.utilization}% utilization costing $${license.cost}/month`,
        action: 'Consider downgrading license tier or reallocating seats',
        impact: 'Medium',
        estimatedValue: -license.cost * 0.5 // 50% potential savings
      });
    });

    // Revenue growth recommendations
    const highValueClients = await Client.find({
      healthScore: { $gte: 85 },
      monthlyRevenue: { $gt: 5000 }
    }).limit(3);

    highValueClients.forEach(client => {
      recommendations.push({
        type: 'REVENUE_GROWTH',
        priority: 'MEDIUM',
        title: `Upsell Opportunity: ${client.name}`,
        description: `High satisfaction client with potential for service expansion`,
        action: 'Propose additional services or upgraded plans',
        impact: 'High',
        estimatedValue: client.monthlyRevenue * 0.3 // 30% upsell potential
      });
    });

    // Operational efficiency recommendations
    const efficiencyRecommendations = await FinancialData.aggregate([
      {
        $group: {
          _id: '$department',
          avgCost: { $avg: '$operationalCosts' },
          avgRevenue: { $avg: '$revenue' }
        }
      },
      {
        $project: {
          department: '$_id',
          efficiency: {
            $cond: [
              { $eq: ['$avgRevenue', 0] },
              0,
              { $divide: ['$avgCost', '$avgRevenue'] }
            ]
          }
        }
      },
      {
        $match: {
          efficiency: { $gt: 0.7 } // More than 70% cost to revenue ratio
        }
      }
    ]);

    efficiencyRecommendations.forEach(dept => {
      recommendations.push({
        type: 'OPERATIONAL_EFFICIENCY',
        priority: 'LOW',
        title: `Efficiency Improvement: ${dept.department}`,
        description: `High cost-to-revenue ratio of ${(dept.efficiency * 100).toFixed(1)}%`,
        action: 'Review operational processes and resource allocation',
        impact: 'Medium',
        estimatedValue: -1000 // Estimated monthly savings
      });
    });

    // Sort by priority and impact
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    recommendations.sort((a, b) => {
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return Math.abs(b.estimatedValue) - Math.abs(a.estimatedValue);
    });

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;