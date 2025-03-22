const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const memoryStore = require('../utils/memoryStore');
const User = require('../models/user');

/**
 * User Repository - Handles all data access for users
 */
class UserRepository {
    /**
     * Create a new user
     */
    async create(email, password) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const client = await pool.connect();
            
            try {
                console.log(`Creating user: ${email}`);
                const result = await client.query(
                    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
                    [email, hashedPassword]
                );
                return new User(result.rows[0]);
            } catch (error) {
                this._handleDatabaseError(error, email);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._createInMemory(email, password);
            }
            throw error;
        }
    }
    
    /**
     * Find user by email
     */
    async findByEmail(email) {
        try {
            const client = await pool.connect();
            try {
                const result = await client.query(
                    'SELECT * FROM users WHERE email = $1',
                    [email]
                );
                return result.rows[0] ? new User(result.rows[0]) : null;
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._findByEmailInMemory(email);
            }
            throw error;
        }
    }
    
    /**
     * Find user by ID
     */
    async findById(id) {
        try {
            const client = await pool.connect();
            try {
                const result = await client.query(
                    'SELECT * FROM users WHERE id = $1',
                    [id]
                );
                return result.rows[0] ? new User(result.rows[0]) : null;
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._findByIdInMemory(id);
            }
            throw error;
        }
    }
    
    /**
     * Health check for database
     */
    async healthCheck() {
        try {
            const client = await pool.connect();
            try {
                await client.query('SELECT 1');
                return true;
            } finally {
                client.release();
            }
        } catch (error) {
            console.warn('Database health check failed:', error.message);
            return false;
        }
    }
    
    // Private helper methods
    
    _handleDatabaseError(error, email) {
        console.error(`Database error:`, error.message);
        
        if (error.code === '23505') {
            throw new Error(`Email ${email} already exists`);
        } else if (error.code === '42P01') {
            throw new Error("Table 'users' does not exist. Please run database migrations");
        }
        
        throw error;
    }
    
    _isConnectionError(error) {
        return error.message.includes('ECONNREFUSED') || 
            error.message.includes('connection refused') ||
            error.message.includes('no pg_hba.conf entry');
    }
    
    // In-memory fallback methods
    
    async _createInMemory(email, password) {
        console.log(`Using in-memory storage for user creation: ${email}`);
        
        if (memoryStore.users.some(user => user.email === email)) {
            throw new Error(`Email ${email} already exists`);
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: ++memoryStore.lastId,
            email,
            password_hash: hashedPassword,
            created_at: new Date(),
            updated_at: new Date()
        };
        
        memoryStore.users.push(newUser);
        return new User(newUser);
    }
    
    _findByEmailInMemory(email) {
        const user = memoryStore.users.find(user => user.email === email);
        return user ? new User(user) : null;
    }
    
    _findByIdInMemory(id) {
        const user = memoryStore.users.find(user => user.id === parseInt(id));
        return user ? new User(user) : null;
    }
}

module.exports = new UserRepository();
