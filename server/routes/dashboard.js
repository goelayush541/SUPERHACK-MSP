const express = require('express');
const { protect } = require('../middleware/auth');
const Client = require('../models/Client');
const FinancialData = require('../models/FinancialData');
const SoftwareLicense = require('../models/SoftwareLicense');

const router = express.Router();

// @desc    Get dashboard overview data
// @route   GET /api/dashboard/overview
// @access  Private
router.get('/overview', protect, async (req, res) => {
  try {
    // Get total clients
    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ status: 'active' });
    
    // Get financial data for current month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    
    const financialData = await FinancialData.aggregate([
      {
        $match: {
          month: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$revenue' },
          totalCosts: { $sum: '$operationalCosts' },
          avgClientProfitability: { $avg: { $subtract: ['$revenue', '$operationalCosts'] } }
        }
      }
    ]);

    // Get client health statistics
    const clientHealth = await Client.aggregate([
      {
        $group: {
          _id: null,
          avgHealthScore: { $avg: '$healthScore' },
          avgSLACompliance: { $avg: '$slaCompliance' },
          highRiskClients: {
            $sum: {
              $cond: [{ $lt: ['$healthScore', 60] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get software costs
    const softwareCosts = await SoftwareLicense.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$cost' },
          underutilizedLicenses: {
            $sum: {
              $cond: [{ $lt: ['$utilization', 50] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      clients: {
        total: totalClients,
        active: activeClients,
        health: clientHealth[0] || { avgHealthScore: 0, avgSLACompliance: 0, highRiskClients: 0 }
      },
      financial: financialData[0] || { totalRevenue: 0, totalCosts: 0, avgClientProfitability: 0 },
      software: softwareCosts[0] || { totalCost: 0, underutilizedLicenses: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get profitability insights
// @route   GET /api/dashboard/profitability
// @access  Private
router.get('/profitability', protect, async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const profitabilityData = await FinancialData.aggregate([
      {
        $match: {
          month: { $gte: sixMonthsAgo }
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

    // Client profitability ranking
    const clientProfitability = await Client.aggregate([
      {
        $lookup: {
          from: 'financialdata',
          localField: '_id',
          foreignField: 'clientId',
          as: 'financialData'
        }
      },
      {
        $project: {
          name: 1,
          healthScore: 1,
          monthlyRevenue: 1,
          costToServe: 1,
          profitability: { $subtract: ['$monthlyRevenue', '$costToServe'] },
          margin: {
            $cond: [
              { $eq: ['$monthlyRevenue', 0] },
              0,
              { $multiply: [
                { $divide: [
                  { $subtract: ['$monthlyRevenue', '$costToServe'] },
                  '$monthlyRevenue'
                ]},
                100
              ]}
            ]
          }
        }
      },
      {
        $sort: { profitability: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      trend: profitabilityData,
      topClients: clientProfitability
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;