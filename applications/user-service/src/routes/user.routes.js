/**
 * User Routes
 * 
 * PUT    /users/profile  - Update profile (protected)
 * PUT    /users/password - Change password (protected)
 * DELETE /users/account  - Deactivate account (protected)
 * GET    /users          - List users (admin only)
 */

const express = require('express');
const { body } = require('express-validator');
const UserController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
];

// Routes
router.put('/profile', updateProfileValidation, validate, UserController.updateProfile);
router.put('/password', changePasswordValidation, validate, UserController.changePassword);
router.delete('/account', UserController.deactivateAccount);
router.get('/', authorize('admin'), UserController.listUsers);

module.exports = router;
