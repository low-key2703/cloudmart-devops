/**
 * User Controller
 * 
 * Handles user profile operations.
 */

const UserModel = require('../models/user.model');
const { hashPassword, comparePassword } = require('../utils/auth');

const UserController = {
  /**
   * Update user profile
   * PUT /users/profile
   */
  async updateProfile(req, res) {
    try {
      const { firstName, lastName, phone } = req.body;
      
      const user = await UserModel.update(req.user.userId, {
        firstName,
        lastName,
        phone
      });
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Failed to update profile'
      });
    }
  },

  /**
   * Change password
   * PUT /users/password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Get user with password hash
      const user = await UserModel.findByEmail(req.user.email);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      // Verify current password
      const isValid = await comparePassword(currentPassword, user.password_hash);
      if (!isValid) {
        return res.status(401).json({
          error: 'Current password is incorrect'
        });
      }
      
      // Hash and save new password
      const passwordHash = await hashPassword(newPassword);
      await UserModel.updatePassword(user.id, passwordHash);
      
      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        error: 'Failed to change password'
      });
    }
  },

  /**
   * Deactivate account
   * DELETE /users/account
   */
  async deactivateAccount(req, res) {
    try {
      const result = await UserModel.deactivate(req.user.userId);
      
      if (!result) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      res.json({
        message: 'Account deactivated successfully'
      });
    } catch (error) {
      console.error('Deactivate account error:', error);
      res.status(500).json({
        error: 'Failed to deactivate account'
      });
    }
  },

  /**
   * List all users (admin only)
   * GET /users
   */
  async listUsers(req, res) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const page = parseInt(req.query.page, 10) || 1;
      const offset = (page - 1) * limit;
      
      const [users, total] = await Promise.all([
        UserModel.findAll({ limit, offset }),
        UserModel.count()
      ]);
      
      res.json({
        users: users.map(u => ({
          id: u.id,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          role: u.role,
          isActive: u.is_active,
          createdAt: u.created_at
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('List users error:', error);
      res.status(500).json({
        error: 'Failed to list users'
      });
    }
  }
};

module.exports = UserController;
