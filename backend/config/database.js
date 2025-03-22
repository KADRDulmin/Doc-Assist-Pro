const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

/**
 * Check if running in Docker container
 */
const isRunningInContainer = () => {
    try {
        return fs.existsSync('/.dockerenv');
    } catch (error) {
        return false;
    }
};

/**
 * Get appropriate host based on environment
 */
const getHost = () => {
    // If in container and host is localhost, use 'db' service name
    if (isRunningInContainer() && process.env.PGHOST === 'localhost') {
        console.log('Running in Docker container, using "db" as database host');
        return 'db';
    }
    
    // Force IPv4 for localhost connections
    if (process.env.PGHOST === 'localhost') {
        return '127.0.0.1'; // Use IPv4 explicitly
    }
    
    return process.env.PGHOST;
};

// Log connection details
console.log(`Database connection config: Host=${getHost()}, DB=${process.env.PGDATABASE}, User=${process.env.PGUSER}`);

/**
 * Configure PostgreSQL connection with error handling
 */
const pool = new Pool({
    user: process.env.PGUSER,
    host: getHost(),
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    // Connection pool options
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// Handle unexpected errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
});

/**
 * Basic database health check
 */
const checkConnection = async () => {
    const client = await pool.connect();
    try {
        await client.query('SELECT 1');
        return true;
    } catch (error) {
        console.error('Database health check failed:', error.message);
        return false;
    } finally {
        client.release();
    }
};

module.exports = {
    pool,
    checkConnection,
    getHost
};
