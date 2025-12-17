const rateLimit = require('express-rate-limit');
const config = require('../config');

const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = rateLimiter;
