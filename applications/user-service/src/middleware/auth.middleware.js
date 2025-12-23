/**
 * Authentication Middleware
 *
 * Protects routes by verifying JWT tokens.
*/

const { verifyToken } = require('../utils/auth');

// Require valid JWT token
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
	return res.status(401).json({
	  error: 'Authentication required',
	  message: 'Please provide a valid Bearer token'
	});
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
	return res.status(401).json({
	  error: 'Invalid token',
	  message: 'Token is invalid or expired'
	});
  }

  // Attach user info to request
  req.user = decoded;
  next();
}

// Require specific role(s)
function authorize(...allowedRoles) {
  return (req, res, next) => {
	if (! req.user) {
	  return res.status(401).json({
	    error: 'Authentication required'
	  });
	}

	if (!allowedRoles.includes(req.user.role)) {
	  return res.status(403).json({
	    error: 'Forbidden',
	    message: 'You do not have permission to access this resource'
	  });
	}

	next();
  };
}

module.exports = {
  authenticate,
  authorize
};

