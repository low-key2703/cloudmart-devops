/**
 * User Service - Main Application
 * 
 * Microservice for user authentication and management.
 * Part of CloudMart e-commerce platform.
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const promClient = require('prom-client');

const config = require('./config');
const db = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

// Prometheus Metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'user_service_' });

const httpRequestDuration = new promClient.Histogram({
  name: 'user_service_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new promClient.Counter({
  name: 'user_service_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});


// Middleware

// CORS - allow cross-origin requests
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Request logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration.labels(req.method, route, res.statusCode).observe(duration);
    httpRequestTotal.labels(req.method, route, res.statusCode).inc();
  });
  
  next();
});


// Health Check Endpoints

// Liveness probe - is the service running?
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'user-service',
    timestamp: new Date().toISOString()
  });
});

// Readiness probe - is the service ready to accept traffic?
app.get('/health/ready', async (req, res) => {
  const dbHealthy = await db.healthCheck();
  
  if (dbHealthy) {
    res.json({
      status: 'ready',
      database: 'connected'
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      database: 'disconnected'
    });
  }
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});


// API Routes

app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'CloudMart User Service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      ready: '/health/ready',
      metrics: '/metrics',
      auth: '/auth',
      users: '/users'
    }
  });
});


// Error Handling

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'An unexpected error occurred'
  });
});


// Server Startup

const server = app.listen(config.port, () => {
  console.log(`

       CloudMart User Service              

  Status:  Running                        
  Port:    ${config.port}                 
  Mode:    ${config.nodeEnv.padEnd(11)}   


Endpoints:
  • Health:  http://localhost:${config.port}/health
  • Ready:   http://localhost:${config.port}/health/ready
  • Metrics: http://localhost:${config.port}/metrics
  • Auth:    http://localhost:${config.port}/auth
  • Users:   http://localhost:${config.port}/users
  `);
});


// Graceful Shutdown

async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  server.close(async () => {
    console.log('HTTP server closed');
    await db.close();
    console.log('Database connections closed');
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
