/**
 * Database schema repair utility
 * This script checks and repairs common database schema issues
 */
const { pool } = require('../config/database');
const dotenv = require('dotenv');
const { Client } = require('pg');
const { createDatabaseIfNotExists } = require('./setup-database');

// Load environment variables
dotenv.config();

// Log connection info
const dbConfig = {
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'doc_assist',
  user: process.env.PGUSER || 'postgres',
};

console.log('Database connection config:', {
  Host: dbConfig.host,
  DB: dbConfig.database,
  User: dbConfig.user
});

async function repairSchema() {
    let client;
    try {
        // First make sure database exists
        await createDatabaseIfNotExists();
        
        // Now connect to the application database
        client = await pool.connect();
        console.log('Connected to database for schema repair...');
        
        // Check if users table exists
        const usersExist = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            )
        `);
        
        if (!usersExist.rows[0].exists) {
            console.error('❌ Users table does not exist!');
            console.log('Please run: node scripts/setup-database.js');
            return;
        }
        
        // Get column information for users table
        const columnInfo = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        
        const columns = columnInfo.rows.map(row => row.column_name);
        console.log('Current users table columns:', columns);
        
        // Check for first_name/last_name vs firstname/lastname issue
        const hasFirstName = columns.includes('first_name');
        const hasFirstNameCamel = columns.includes('firstname');
        
        if (!hasFirstName && !hasFirstNameCamel) {
            console.log('⚠️ Neither first_name nor firstname columns found!');
            
            // Add the missing columns
            console.log('Adding first_name and last_name columns...');
            await client.query(`
                ALTER TABLE users 
                ADD COLUMN first_name VARCHAR(100),
                ADD COLUMN last_name VARCHAR(100)
            `);
            console.log('✅ Added missing name columns');
        } else if (hasFirstNameCamel) {
            console.log('⚠️ Found camelCase column names (firstname, lastname) instead of snake_case (first_name, last_name)');
            console.log('Converting column names to snake_case...');
            
            // Begin transaction
            await client.query('BEGIN');
            
            try {
                // Add snake_case columns
                await client.query(`
                    ALTER TABLE users 
                    ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
                    ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)
                `);
                
                // Copy data from camelCase to snake_case columns
                await client.query(`
                    UPDATE users 
                    SET first_name = firstname,
                        last_name = lastname
                `);
                
                await client.query('COMMIT');
                console.log('✅ Successfully added snake_case columns with data copied from camelCase columns');
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            }
        } else {
            console.log('✅ Schema looks good! Using snake_case column names (first_name, last_name)');
        }
        
    } catch (error) {
        console.error('❌ Schema repair failed:', error);
    } finally {
        if (client) client.release();
    }
}

// Run the script directly
if (require.main === module) {
    repairSchema()
        .then(() => {
            console.log('Schema repair check completed');
            process.exit(0);
        })
        .catch(err => {
            console.error('Schema repair failed with error:', err);
            process.exit(1);
        });
}

module.exports = { repairSchema };
