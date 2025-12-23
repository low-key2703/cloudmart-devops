/**
 * Configuration Module
 *
 * Centralizes all environment variables in one place.
*/

require('dotenv').config();

const config = {
	// Server
	port: parseInt(process.env.PORT, 10) || 3001,
	nodeEnv: process.env.NODE_ENV || 'development',

	// Database
	databaseUrl: process.env.DATABASE_URL,

	//JWT
	jwt: {
		secret: process.env.JWT_SECRET,
		expiresIn: process.env.JWT_EXPIRES_IN || '24h',
		refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
	},

	// Bcrypt
	bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10
};


/**
 * Validate required configuration
 * Fails fast at startup rather than at runtime
*/

function validateConfig() {
  const required = [
	{ key: 'databaseUrl', name: 'DATABASE_URL' },
	{ key: 'jwt.secret', name: 'JWT_SECRET' }
  ];

  const missing = [];

  required.forEach(({ key, name }) => {
	const value = key.split('.').reduce((obj, k) => obj?.[k], config);
	if (!value) {
		missing.push(name);
	}
  });

  if (missing.length > 0) {
	console.error('Missing required environment variables:', missing.join(', '));
	process.exit(1);
  }
}

validateConfig();

module.exports = config;
