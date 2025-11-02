const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const FinancialData = require('../models/FinancialData');
const Client = require('../models/Client');

const router = express.Router();

// @desc    Get financial overview
// @route   GET /api/financial/overview
// @access  Private
router.get('/overview', protect, async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const financialData = await FinancialData.aggregate([
      {
        $match: {
          month: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$revenue' },
          totalCosts: { $sum: '$operationalCosts' },
          avgMonthlyRevenue: { $avg: '$revenue' },
          avgMonthlyCosts: { $avg: '$operationalCosts' }
        }
      }
    ]);

    const monthlyTrend = await FinancialData.aggregate([
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

    const costBreakdown = await FinancialData.aggregate([
      {
        $match: {
          month: { 
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      },
      {
        $group: {
          _id: null,
          software: { $sum: '$softwareCosts' },
          personnel: { $sum: '$personnelCosts' },
          infrastructure: { $sum: '$infrastructureCosts' },
          operational: { $sum: '$operationalCosts' }
        }
      }
    ]);

    res.json({
      overview: financialData[0] || {
        totalRevenue: 0,
        totalCosts: 0,
        avgMonthlyRevenue: 0,
        avgMonthlyCosts: 0
      },
      monthlyTrend,
      costBreakdown: costBreakdown[0] || {
        software: 0,
        personnel: 0,
        infrastructure: 0,
        operational: 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get budget utilization
// @route   GET /api/financial/budget
// @access  Private
router.get('/budget', protect, async (req, res) => {
  try {
    const currentMonth = new Date();
    currentMonth.setDate(1);

    const budgetData = await FinancialData.aggregate([
      {
        $match: {
          month: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: '$department',
          totalBudget: { $sum: '$budget' },
          totalSpend: { $sum: '$actualSpend' },
          utilization: {
            $avg: {
              $cond: [
                { $eq: ['$budget', 0] },
                0,
                { $multiply: [
                  { $divide: ['$actualSpend', '$budget'] },
                  100
                ]}
              ]
            }
          }
        }
      }
    ]);

    res.json(budgetData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add financial data
// @route   POST /api/financial
// @access  Private
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const financialData = await FinancialData.create(req.body);
    res.status(201).json(financialData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get department-wise spending
// @route   GET /api/financial/departments
// @access  Private
router.get('/departments', protect, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const departmentSpending = await FinancialData.aggregate([
      {
        $match: {
          month: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: '$department',
          totalSpend: { $sum: '$operationalCosts' },
          budget: { $sum: '$budget' },
          revenue: { $sum: '$revenue' }
        }
      }
    ]);

    res.json(departmentSpending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;