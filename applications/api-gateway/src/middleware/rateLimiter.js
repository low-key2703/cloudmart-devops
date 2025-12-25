const rateLimit = require('express-rate-limit');
const config = require('../config');

let store;

async function initRedisStore() {
  if(!config.redis.url) return null;

  try {
    const RedisStore = require('rate-limit-redis').default;
    const Redis = require('ioredis');

    const redisClient = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    redisClient.on('error', () => {});

    await redisClient.ping();
    console.log('Rate limiter connected to Redis');

    return new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'cloudmart:rl:'
    });
  } catch (err) {
      console.warn('Failed to initialize Redis, using in-memory rate limiting');
      return null;
  }
}

initRedisStore().then((redisStore) => {
  if (redisStore) {
    rateLimiter.store = redisStore;
  }
});

const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = rateLimiter;
