const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const config = require('./config');
const authMiddleware = require('./middleware/auth');
const rateLimiter = require('./middleware/rateLimiter');
const healthRoutes = require('./routes/health');
const { router: metricsRoutes, metricsMiddleware } = require('./routes/metrics');

const app = express();

app.use(helmet());
app.use(cors());
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next(); // Skip body parsing for proxied routes
  }
  express.json()(req, res, next);
});
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  express.urlencoded({ extended: true })(req, res, next);
});
app.use(morgan('combined'));
app.use(metricsMiddleware);
app.use(rateLimiter);

app.use(healthRoutes);
app.use(metricsRoutes);
app.use('/api', authMiddleware);

app.use('/api/v1/auth', createProxyMiddleware({
  target: config.services.userService,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/auth': '/auth' },
  onError: (err, req, res) => {
    res.status(503).json({ error: 'Service Unavailable', message: 'User service is not available' });
  }
}));

app.use('/api/v1/users', createProxyMiddleware({
  target: config.services.userService,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/users': '/users' },
  onError: (err, req, res) => {
    res.status(503).json({ error: 'Service Unavailable', message: 'User service is not available' });
  }
}));

app.use('/api/v1/products', createProxyMiddleware({
  target: config.services.productService,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/products': '/products' },
  onError: (err, req, res) => {
    res.status(503).json({ error: 'Service Unavailable', message: 'Product service is not available' });
  }
}));

app.use('/api/v1/categories', createProxyMiddleware({
  target: config.services.productService,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/categories': '/categories' },
  onError: (err, req, res) => {
    res.status(503).json({ error: 'Service Unavailable', message: 'Product service is not available' });
  }
}));

app.use('/api/v1/orders', createProxyMiddleware({
  target: config.services.orderService,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/orders': '/orders' },
  onError: (err, req, res) => {
    res.status(503).json({ error: 'Service Unavailable', message: 'Order service is not available' });
  }
}));

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'The requested resource was not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: 'Something went wrong' });
});

app.listen(config.port, () => {
  console.log(`🚀 API Gateway running on port ${config.port}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`❤️  Health check: http://localhost:${config.port}/health`);
});
