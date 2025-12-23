/**
 * Database Migration Script
 *
 * Creates tables for User Service:
 * - users: Store user accounts
 * - addresses: Store user shipping/billing addresses
 *
 * Run with npm run migrate
*/

const { pool } = require('./database');

const migrations = [
  {
	name: 'create_users_table',
	sql: `
	  CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		email VARCHAR(255) UNIQUE NOT NUll,
		password_hash VARCHAR(255) NOT NULL,
		first_name VARCHAR(100),
		last_name VARCHAR(100),
		phone VARCHAR(20),
		role VARCHAR(20) DEFAULT 'customer',
		is_active BOOLEAN DEFAULT true,
		email_verified BOOLEAN DEFAULT false,
		last_login TIMESTAMP WITH TIME ZONE,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	  );
	`
  },
  {
	name: 'create_users_email_index',
	sql: `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`
  },
  {
	name: 'create_addresses_table',
	sql: `
	  CREATE TABLE IF NOT EXISTS addresses (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		user_id UUID NOT NULL REFERENCES users(id) on DELETE CASCADE,
		type VARCHAR(20) DEFAULT 'shipping',
		is_default BOOLEAN DEFAULT false,
		street_address VARCHAR(255) NOT NULL,
		apartment VARCHAR(100),
		city VARCHAR(100) NOT NULL,
		state VARCHAR(100) NOT NULL,
		postal_code VARCHAR(20) NOT NULL,
		country VARCHAR(100) DEFAULT 'INDIA',
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	  );
	`
  },
  {
	name: 'create_addresses_user_index',
	sql: `CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);`
  },
  {
	name: 'create_refresh_tokens_table',
	sql: `
	  CREATE TABLE IF NOT EXISTS refresh_tokens (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		token_hash VARCHAR(255) NOT NUll,
		expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	  );
	`
  },
  {
	name: 'create_refresh_tokens_index',
	sql: `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);`
  }
];

async function migrate() {
  console.log('Starting database migration...\n');

  for (const migration of migrations) {
	try {
	  await pool.query(migration.sql);
	  console.log(`${migration.name} success`);
	} catch (error) {
	  console.error(`${migration.name}: ${error.message}`);
	  process.exit(1);
	}
  }

  console.log('\nMigration completed successfully!');
  await pool.end();
  process.exit(0);
}

migrate();
