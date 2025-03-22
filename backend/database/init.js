/**
 * Database initialization script
 * Checks if required tables exist and creates them if needed
 */
const { pool } = require('../config/database');

/**
 * Initialize database schema and test data
 */
const initializeDatabase = async () => {
    let client;
    try {
        client = await pool.connect();
        console.log('Connected to database for initialization...');
        
        // Check if users table exists
        const tableExists = await client.query(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
        );
        
        if (!tableExists.rows[0].exists) {
            console.log('Users table does not exist, creating it...');
            
            // Create users table
            await client.query(`
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Create index for email lookups
            await client.query(`
                CREATE INDEX idx_users_email ON users(email)
            `);
            
            console.log('✅ Users table created successfully!');
            
            // Add test user
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
        
        console.log('✅ Database initialization complete');
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
    } finally {
        if (client) client.release();
    }
};

// Export for use in app.js
module.exports = { initializeDatabase };

// Run directly if this script is executed on its own
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('Initialization script finished');
            process.exit(0);
        })
        .catch(err => {
            console.error('Initialization script failed:', err);
            process.exit(1);
        });
}
