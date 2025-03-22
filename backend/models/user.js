const { Pool } = require('pg');
const bcrypt = require('bcryptjs'); // Changed from bcrypt to bcryptjs
const fs = require('fs');
require('dotenv').config();

// Check if running in Docker container
const isRunningInContainer = () => {
    try {
        return fs.existsSync('/.dockerenv');
    } catch (error) {
        return false;
    }
};

// Get host with improved container detection
const getHost = () => {
    // If we're in a container and host is set to localhost, use 'db' service name
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

console.log(`Database connection config: Host=${getHost()}, DB=${process.env.PGDATABASE}, User=${process.env.PGUSER}`);

// Configure PostgreSQL connection with better error handling
const pool = new Pool({
    user: process.env.PGUSER,
    host: getHost(),
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    // Improve connection retry options for containerized environments
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection not established
});

// Connection event handling
pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
    console.log('Database connection error, but application will continue running with in-memory storage');
});

// Test database connection on startup with better retry logic
const testConnection = async () => {
    let client;
    let retries = 5;
    let connected = false;
    
    while (retries > 0 && !connected) {
        try {
            console.log(`Testing PostgreSQL connection (${retries} attempts left)...`);
            console.log(`Connecting to: ${getHost()}:${process.env.PGPORT}`);
            
            client = await pool.connect();
            const result = await client.query('SELECT NOW()');
            console.log('✅ Database connection successful! Server time:', result.rows[0].now);
            connected = true;
            
            // Check if users table exists, create if not
            try {
                const tableExists = await client.query(
                    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
                );
                
                if (!tableExists.rows[0].exists) {
                    console.log('Users table does not exist, creating it...');
                    await client.query(`
                        CREATE TABLE users (
                            id SERIAL PRIMARY KEY,
                            email VARCHAR(255) UNIQUE NOT NULL,
                            password_hash VARCHAR(255) NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )
                    `);
                    console.log('✅ Users table created successfully!');
                    
                    // Add test user for convenience in new environments
                    try {
                        await client.query(
                            'INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                            ['test@example.com', '$2a$10$3euPcmQFCiblsZeEu5s7p.9MUZWj3bcJzuLFJBs9QVdYj.RRVCICK'] // password: test123
                        );
                        console.log('✅ Test user created. Email: test@example.com, Password: test123');
                    } catch (userErr) {
                        console.error('Error creating test user:', userErr.message);
                    }
                } else {
                    console.log('✅ Users table already exists');
                }
            } catch (tableErr) {
                console.error('Error checking/creating users table:', tableErr.message);
            }
        } catch (error) {
            console.error(`❌ Database connection attempt failed (${retries} left):`, error.message);
            retries--;
            if (retries > 0) {
                console.log('Retrying in 3 seconds...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } finally {
            if (client) client.release();
        }
    }
    
    if (!connected) {
        console.error('❌ All database connection attempts failed. Using in-memory storage as fallback.');
        // Initialize memory storage with test user
        memoryStorage.users.push({
            id: ++memoryStorage.lastId,
            email: 'test@example.com',
            password_hash: '$2a$10$3euPcmQFCiblsZeEu5s7p.9MUZWj3bcJzuLFJBs9QVdYj.RRVCICK' // password: test123
        });
        console.log('Added test user to in-memory storage. Email: test@example.com, Password: test123');
    }
    
    return connected;
};

// Create in-memory fallbacks for testing/development when DB is unavailable
const memoryStorage = {
    users: [],
    lastId: 0
};

// Database operations
const dbOperations = {
    registerUser: async (email, password) => {
        // Use bcryptjs for hashing (10 rounds, same as before)
        const hashedPassword = await bcrypt.hash(password, 10);
        const client = await pool.connect();
        try {
            console.log(`Inserting user into database: ${email}`);
            await client.query('INSERT INTO users (email, password_hash) VALUES ($1, $2)', [email, hashedPassword]);
            console.log(`User inserted successfully: ${email}`);
        } catch (error) {
            console.error(`Database error during user registration: ${error.message}`);
            
            // Add more context to the error
            if (error.code === '23505') {
                throw new Error(`Email ${email} already exists`);
            } else if (error.code === '42P01') {
                throw new Error("Table 'users' does not exist. Please run database migrations");
            } else {
                throw error;
            }
        } finally {
            client.release();
        }
    },
    
    getUserByEmail: async (email) => {
        const client = await pool.connect();
        try {
            const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);
            return res.rows[0];
        } catch (error) {
            console.error(`Database error during user lookup: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    },
    
    // Add a health check function to verify database connectivity
    checkDatabaseConnection: async () => {
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
    }
};

const memoryOperations = {
    registerUser: async (email, password) => {
        console.log(`Using in-memory storage for registration: ${email}`);
        // Check if email already exists
        if (memoryStorage.users.some(user => user.email === email)) {
            throw new Error(`Email ${email} already exists`);
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { 
            id: ++memoryStorage.lastId, 
            email, 
            password_hash: hashedPassword 
        };
        
        memoryStorage.users.push(newUser);
        console.log(`In-memory user registered: ${email}`);
    },
    
    getUserByEmail: async (email) => {
        return memoryStorage.users.find(user => user.email === email) || null;
    },
    
    checkDatabaseConnection: async () => {
        return true; // Memory storage is always available
    }
};

// Export methods with DB fallback
module.exports = {
    registerUser: async (email, password) => {
        try {
            return await dbOperations.registerUser(email, password);
        } catch (error) {
            if (error.message.includes('ECONNREFUSED') || 
                error.message.includes('connection refused') ||
                error.message.includes('no pg_hba.conf entry')) {
                console.warn('Database connection failed, using in-memory storage');
                return await memoryOperations.registerUser(email, password);
            }
            throw error;
        }
    },
    
    getUserByEmail: async (email) => {
        try {
            return await dbOperations.getUserByEmail(email);
        } catch (error) {
            if (error.message.includes('ECONNREFUSED') || 
                error.message.includes('connection refused') ||
                error.message.includes('no pg_hba.conf entry')) {
                console.warn('Database connection failed, using in-memory storage');
                return await memoryOperations.getUserByEmail(email);
            }
            throw error;
        }
    },
    
    checkDatabaseConnection: async () => {
        try {
            return await dbOperations.checkDatabaseConnection();
        } catch (error) {
            console.warn('Database connection check failed, using in-memory storage');
            return await memoryOperations.checkDatabaseConnection();
        }
    }
};

// Don't await the test connection - let it run in the background
testConnection().catch(err => {
    console.error('Database connection test failed but application will continue:', err.message);
});