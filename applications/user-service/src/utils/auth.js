/**
 * Authentication Utilities
 *
 * Handles password hashing and JWT token operations
*/

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

// Hash a password
async function hashPassword(password) {
  return bcrypt.hash(password, config.bcryptSaltRounds);
}

// Compare passwords with hash
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Generate access token
function generateAccessToken(user) {
  const payload = {
	userId: user.id,
	email: user.email,
	role: user.role
  };

  return jwt.sign(payload, config.jwt.secret, {
	expiresIn: config.jwt.expiresIn
  });
}

// Generate refresh token
function generateRefreshToken(user) {
  const payload = {
	userId: user.id,
	type: 'refresh'
  };

  return jwt.sign(payload, config.jwt.secret, {
	expiresIn: config.jwt.refreshExpiresIn
  });
}

// Verify and decode a token
function verifyToken(token) {
  try {
	return jwt.verify(token, config.jwt.secret);
  } catch (error) {
	return null;
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken
};
