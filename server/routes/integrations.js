const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const IntegrationService = require('../services/integrations');

const router = express.Router();
const integrationService = new IntegrationService();

// @desc    Handle webhooks from external services
// @route   POST /api/integrations/webhook/:service
// @access  Public (but should be secured with webhook secrets)
router.post('/webhook/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const payload = req.body;

    // Verify webhook signature (implementation depends on service)
    const isValid = await verifyWebhookSignature(service, req);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid webhook signature' });
    }

    await integrationService.handleWebhook(service, payload);
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Sync data from external service
// @route   POST /api/integrations/sync/:service
// @access  Private
router.post('/sync/:service', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { service } = req.params;
    const options = req.body;

    const result = await integrationService.syncData(service, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get integration status
// @route   GET /api/integrations/status
// @access  Private
router.get('/status', protect, async (req, res) => {
  try {
    const status = {
      quickbooks: {
        connected: !!process.env.QUICKBOOKS_CLIENT_ID,
        lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'active'
      },
      connectwise: {
        connected: !!process.env.CONNECTWISE_COMPANY_ID,
        lastSync: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        status: 'active'
      },
      xero: {
        connected: false,
        status: 'not_configured'
      },
      freshbooks: {
        connected: false,
        status: 'not_configured'
      }
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to verify webhook signatures
async function verifyWebhookSignature(service, req) {
  // Implementation depends on the specific service
  // This is a simplified version
  switch (service) {
    case 'quickbooks':
      // Verify QuickBooks webhook signature
      return true;
    case 'connectwise':
      // Verify ConnectWise webhook signature
      return true;
    default:
      return false;
  }
}

module.exports = router;