const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const Client = require('../models/Client');

const router = express.Router();

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sortBy = 'name' } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const clients = await Client.find(query)
      .sort({ [sortBy]: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Client.countDocuments(query);

    res.json({
      clients,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create client
// @route   POST /api/clients
// @access  Private
// @desc    Create a new client
// @route   POST /api/clients
// @access  Private
router.post('/', protect, authorize('admin', 'manager', 'sales_agent'), async (req, res) => {
  try {
    console.log('Creating new client with data:', req.body);
    
    const client = new Client({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      industry: req.body.industry,
      contractValue: req.body.contractValue || 0,
      startDate: req.body.startDate || new Date(),
      healthScore: req.body.healthScore || 75,
      slaCompliance: req.body.slaCompliance || 90,
      satisfactionScore: req.body.satisfactionScore || 80,
      monthlyRevenue: req.body.monthlyRevenue || 0,
      costToServe: req.body.costToServe || 0,
      status: req.body.status || 'active',
      tags: req.body.tags || []
    });

    const savedClient = await client.save();
    console.log('Client created successfully:', savedClient._id);
    
    res.status(201).json(savedClient);
  } catch (error) {
    console.error('Error creating client:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation Error', 
        errors: Object.values(error.errors).map(e => e.message) 
      });
    }
    
    res.status(500).json({ message: error.message });
  }
});
// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
router.put('/:id', protect, authorize('admin', 'manager', 'sales_agent'), async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get client performance analytics
// @route   GET /api/clients/analytics/performance
// @access  Private
router.get('/analytics/performance', protect, async (req, res) => {
  try {
    const performanceData = await Client.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgHealthScore: { $avg: '$healthScore' },
          avgSLACompliance: { $avg: '$slaCompliance' },
          avgSatisfaction: { $avg: '$satisfactionScore' },
          totalRevenue: { $sum: '$monthlyRevenue' }
        }
      }
    ]);

    const healthDistribution = await Client.aggregate([
      {
        $bucket: {
          groupBy: '$healthScore',
          boundaries: [0, 60, 80, 90, 101],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            minHealth: { $min: '$healthScore' },
            maxHealth: { $max: '$healthScore' }
          }
        }
      }
    ]);

    res.json({
      performance: performanceData,
      healthDistribution
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;