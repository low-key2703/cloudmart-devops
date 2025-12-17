const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

router.get('/ready', (req, res) => {
  res.status(200).json({ status: 'ready', service: 'api-gateway' });
});

module.exports = router;
