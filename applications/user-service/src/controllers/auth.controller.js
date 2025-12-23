/**
 * Auth Controller
 * 
 * Handles user registration, login, and token refresh.
 */

const UserModel = require('../models/user.model');
const { 
  hashPassword, 
  comparePassword, 
  generateAccessToken, 
  generateRefreshToken,
  verifyToken 
} = require('../utils/auth');

const AuthController = {
  /**
   * Register new user
   * POST /auth/register
   */
  async register(req, res) {
    try {
      const { email, password, firstName, lastName, phone } = req.body;
      
      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: 'Email already registered',
          message: 'An account with this email already exists'
        });
      }
      
      // Hash password and create user
      const passwordHash = await hashPassword(password);
      const user = await UserModel.create({
        email,
        passwordHash,
        firstName,
        lastName,
        phone
      });
      
      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      
      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: 'An unexpected error occurred'
      });
    }
  },

  /**
   * Login user
   * POST /auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }
      
      // Check if account is active
      if (!user.is_active) {
        return res.status(403).json({
          error: 'Account deactivated',
          message: 'This account has been deactivated'
        });
      }
      
      // Verify password
      const isValid = await comparePassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }
      
      // Update last login
      await UserModel.updateLastLogin(user.id);
      
      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: 'An unexpected error occurred'
      });
    }
  },

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          error: 'Refresh token required'
        });
      }
      
      // Verify refresh token
      const decoded = verifyToken(refreshToken);
      if (!decoded || decoded.type !== 'refresh') {
        return res.status(401).json({
          error: 'Invalid refresh token'
        });
      }
      
      // Get user
      const user = await UserModel.findById(decoded.userId);
      if (!user || !user.is_active) {
        return res.status(401).json({
          error: 'User not found or inactive'
        });
      }
      
      // Generate new access token
      const accessToken = generateAccessToken(user);
      
      res.json({
        accessToken
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        error: 'Token refresh failed'
      });
    }
  },

  /**
   * Get current user info
   * GET /auth/me
   */
  async me(req, res) {
    try {
      const user = await UserModel.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        emailVerified: user.email_verified,
        createdAt: user.created_at
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        error: 'Failed to get user info'
      });
    }
  }
};

module.exports = AuthController;
