/**
 * User Model
 *
 * Handles all database operations for users.
*/

const db = require('../config/database');

const UserModel = {
  // Create a new user
  async create({ email, passwordHash, firstName, lastName, phone, role = 'customer' }) {
	const sql = `
	  INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
	  Values ($1, $2, $3, $4, $5, $6)
	  RETURNING id, email, first_name, last_name, phone, role, is_active, created_at
	`;
	const values = [email, passwordHash, firstName, lastName, phone, role];
	const result = await db.query(sql, values);
	return result.rows[0];
  },

  // Find user by email ( for login)
  async findByEmail(email) {
	const sql = `
	  SELECT id, email, password_hash, first_name, last_name, phone, role, is_active, email_verified, last_login, created_at
	  FROM users
	  WHERE email = $1
	`;
	const result = await db.query(sql, [email]);
	return result.rows[0] || null;
  },

  // Find user by ID
  async findById(id) {
	const sql = `
	  SELECT id, email, first_name, last_name, phone, role, is_active, email_verified, last_login, created_at, updated_at
	  FROM users
	  WHERE id = $1
	`;
	const result = await db.query(sql, [id]);
	return result.rows[0] || null;
  },

  // Update user profile
  async update(id, { firstName, lastName, phone }) {
	const sql = `
	  UPDATE users
	  SET first_name = COALESCE($2, first_name),
	      last_name = COALESCE($3, last_name),
	      phone = COALESCE($4, phone),
	      updated_at = CURRENT_TIMESTAMP
	  WHERE id = $1
	  RETURNING id, email, first_name, last_name, phone, role, is_active, updated_at
	`;
	const values = [id, firstName, lastName, phone];
	const result = await db.query(sql, values);
	return result.rows[0] || null;
  },

  // Update last login timestamp
  async updateLastLogin(id) {
	const sql = `
	  UPDATE users
	  SET last_login = CURRENT_TIMESTAMP
	  WHERE id = $1
	`;
	await db.query(sql, [id]);
  },

  // Change Password
  async updatePassword(id, passwordHash) {
	const sql = `
	  UPDATE users
	  SET password_hash = $2, updated_at = CURRENT_TIMESTAMP
	  WHERE id = $1
	`;
	await db.query(sql, [id, passwordHash]);
  },

  // Soft delete (deactivate) user
  async deactivate(id) {
	const sql = `
	  UPDATE users
	  SET is_active = false, updated_at = CURRENT_TIMESTAMP
	  WHERE id = $1
	  RETURNING id
	`;
	const result = await db.query(sql, [id]);
	return result.rows[0] || null;
  },

  // List all users (admin only)
  async findAll({ limit = 20, offset = 0 }) {
	const sql = `
	  SELECT id, email, first_name, last_name, role, is_active, created_at
	  FROM users
	  ORDER BY created_at DESC
	  LIMIT $1 OFFSET $2
	`;
	const result = await db.query(sql, [limit, offset]);
	return result.rows;
  },

  // Count total users
  async count() {
	const sql = `SELECT COUNT(*) as total FROM users`;
	const result = await db.query(sql);
	return parseInt(result.rows[0].total, 10);
  }
};

module.exports = UserModel;
