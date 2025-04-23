/**
 * Database Schema Check Script
 * Verifies and fixes common schema problems
 */
const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database connection config
const config = {
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'doc_assist',
};

console.log('Database connection config:', {
  Host: config.host,
  Port: config.port,
  DB: config.database,
  User: config.user
});

/**
 * Check and fix schema issues
 */
async function checkSchema() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Check users table
    console.log('Checking users table structure...');
    
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.error('❌ Users table does not exist! Database initialization required.');
      return false;
    }
    
    // Get column information
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const columns = columnsResult.rows.map(row => row.column_name);
    console.log('Found columns:', columns);
    
    // Check for first_name/last_name vs firstname/lastname
    const hasFirstName = columns.includes('first_name');
    const hasLastName = columns.includes('last_name');
    const hasFirstNameCamel = columns.includes('firstname');
    const hasLastNameCamel = columns.includes('lastname');
    
    // Handle missing name columns
    if (!hasFirstName && !hasFirstNameCamel) {
      console.log('Adding first_name column...');
      await client.query('ALTER TABLE users ADD COLUMN first_name VARCHAR(100)');
    }
    
    if (!hasLastName && !hasLastNameCamel) {
      console.log('Adding last_name column...');
      await client.query('ALTER TABLE users ADD COLUMN last_name VARCHAR(100)');
    }
    
    // Handle camelCase to snake_case migration
    if (hasFirstNameCamel && !hasFirstName) {
      console.log('Migrating from firstname to first_name...');
      await client.query('ALTER TABLE users ADD COLUMN first_name VARCHAR(100)');
      await client.query('UPDATE users SET first_name = firstname');
    }
    
    if (hasLastNameCamel && !hasLastName) {
      console.log('Migrating from lastname to last_name...');
      await client.query('ALTER TABLE users ADD COLUMN last_name VARCHAR(100)');
      await client.query('UPDATE users SET last_name = lastname');
    }
    
    console.log('✅ Schema check completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Schema check failed:', error);
    return false;
  } finally {
    client.end();
  }
}

// Run directly if called from command line
if (require.main === module) {
  checkSchema()
    .then(success => {
      if (success) {
        console.log('Database schema checks passed');
      } else {
        console.error('Database schema checks failed');
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('Unhandled error during schema check:', err);
      process.exit(1);
    });
}

module.exports = { checkSchema };
