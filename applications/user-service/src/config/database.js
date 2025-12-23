/**
 * Database Connection Module
 *
 * Uses connection pooling for efficiency
*/

const { Pool } = require('pg');
const config = require('./index');

/**
 * Parse DATABASE_URL into components
 * Format: postgresql://user:password@host:port/database
*/
function parseConnectionString(url) {
  const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const match = url.match(regex);

  if (!match) {
	throw new Error('Invalide DATABASE_URL format');
  }

  return {
	user: match[1],
	password: match[2],
	host: match[3],
	port: parseInt(match[4], 10),
	database: match[5]
  };
}

// Parse connection string into components
const dbConfig = parseConnectionString(config.databaseUrl);

// Create connection pool with explicit parameters
const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
  max: 20,                          // Maximum connections in pool
  idleTimeoutMillis: 30000,         // Close idle connections after 30s
  connectionTimeoutMillis: 2000     // Fail fast if can't connect in 2s
});

// Log pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

/**
 * Execute a query
 *
 * @param {string} text - SQL query with  $1, $2 placeholders
 * @param {Array} params - Values for placeholders
 * @returns {Promise<Object>} Query result
*/
async function query(text, params) {
  const start = Date.now();

  try {
	const result = await pool.query(text, params);

	// Log slow queries (> 100ms)
	const duration = Date.now() - start;
	if (duration > 100) {
	  console.warn(`Slow query (${duration}ms):`, text);
	}

	return result;
  } catch (error) {
	console.error('Database query error:', {text, error: error.message });
	throw error;
  }
}


/**
 * Health check
*/
async function healthCheck() {
  try {
	await pool.query('SELECT 1');
	return true;
  } catch (error) {
	console.error('Database health check failed:', error.message);
	return false;
  }
}


/**
 * Graceful shutdown - close all connections
*/
async function close() {
  await pool.end();
  console.log('Database pool closed');
}


module.exports = {
  query,
  healthCheck,
  close,
  pool
};

