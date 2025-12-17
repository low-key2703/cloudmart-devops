require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  rateLimit: {
    windowMs: 60 * 1000,
    max: 100
  },
  services: {
    productService: process.env.PRODUCT_SERVICE_URL || 'http://localhost:8000',
    orderService: process.env.ORDER_SERVICE_URL || 'http://localhost:8080',
    userService: process.env.USER_SERVICE_URL || 'http://localhost:3001'
  }
};
