/**
 *
 * POST /auth/register   - Register new user
 * POST /auth/login      - Login user
 * POST /auth/refresh    - Refresh access token
 * GET /auth/me          - Get current user
*/

const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email')
	.isEmail()
	.normalizeEmail()
	.withMessage('Valid email is required'),
  body('password')
	.isLength({ min: 8 })
	.withMessage('Password must be at least 8 characters'),
  body('firstName')
	.optional()
	.trim()
	.isLength({ min: 1, max: 100 }),
  body('lastName')
	.optional()
	.trim()
	.isLength({ min: 1, max: 100 })
];

const loginValidation = [
  body('email')
	.isEmail()
	.normalizeEmail()
	.withMessage('Valid email is required'),
  body('password')
	.notEmpty()
	.withMessage('Password is required')
];

// Routes
router.post('/register', registerValidation, validate, AuthController.register);
router.post('/login', loginValidation, validate, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.get('/me', authenticate, AuthController.me);

module.exports = router;
