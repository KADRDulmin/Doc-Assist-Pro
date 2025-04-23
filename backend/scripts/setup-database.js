/**
 * Database setup script
 * Creates database and tables for local development
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define constants
const DB_NAME = process.env.PGDATABASE || 'doc_assist';
const DEFAULT_DB = 'postgres';

// Database connection config for connecting to default database
const defaultConfig = {
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: DEFAULT_DB
};

// Get SQL initialization script
const initSqlPath = path.join(__dirname, '..', '..', 'database', 'init.sql');
const cleanedSql = fs.readFileSync(initSqlPath, 'utf8')
  .split('\n')
  .filter(line => !line.startsWith('\\'))  // Remove PostgreSQL client commands
  .join('\n')
  .replace(/^SELECT.*?\\gexec$/m, '');     // Remove database creation command

/**
 * Create database if it doesn't exist
 */
async function createDatabaseIfNotExists() {
  const client = new Client(defaultConfig);
  try {
    await client.connect();
    console.log(`Connected to default database: ${DEFAULT_DB}`);
    
    // Check if our database exists
    const checkResult = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [DB_NAME]);
    
    if (checkResult.rowCount === 0) {
      console.log(`Database "${DB_NAME}" does not exist, creating it...`);
      // Create the database
      await client.query(`CREATE DATABASE ${DB_NAME} WITH OWNER ${process.env.PGUSER || 'postgres'}`);
      console.log(`✅ Database "${DB_NAME}" created successfully`);
    } else {
      console.log(`Database "${DB_NAME}" already exists`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error connecting to PostgreSQL or creating database:', error);
    return false;
  } finally {
    await client.end();
  }
}

/**
 * Initialize database schema
 */
async function initializeSchema() {
  // Connection config for the application database
  const dbConfig = {
    ...defaultConfig,
    database: DB_NAME,
  };

  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log(`Connected to application database: ${DB_NAME}`);
    
    // Split the initialization SQL into statements and execute them
    const statements = cleanedSql.split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (const statement of statements) {
      try {
        await client.query(statement);
      } catch (sqlError) {
        console.warn(`Warning: SQL statement failed: ${sqlError.message}`);
        console.warn(`Statement was: ${statement.substring(0, 100)}...`);
        // Continue with other statements
      }
    }
    
    console.log('✅ Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing database schema:', error);
    return false;
  } finally {
    await client.end();
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting database setup...');
  console.log('Database connection config:', {
    Host: defaultConfig.host,
    Port: defaultConfig.port,
    DB: DB_NAME,
    User: defaultConfig.user
  });
  
  // Create database if needed
  const dbCreated = await createDatabaseIfNotExists();
  if (!dbCreated) {
    console.error('❌ Failed to ensure database exists');
    process.exit(1);
  }
  
  // Initialize schema
  const schemaInitialized = await initializeSchema();
  if (!schemaInitialized) {
    console.error('❌ Failed to initialize database schema');
    process.exit(1);
  }
  
  console.log('✅ Database setup completed successfully');
}

// Run the script
if (require.main === module) {
  main().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}

module.exports = { createDatabaseIfNotExists, initializeSchema };
