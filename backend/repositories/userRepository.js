const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const memoryStore = require('../utils/memoryStore');
const User = require('../models/user');

/**
 * User Repository - Handles all data access for users
 */
class UserRepository {
    /**
     * Create a new user with role
     */
    async create(userData) {
        const { email, password, first_name, last_name, role = 'patient', phone } = userData;
        
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const client = await pool.connect();
            
            try {
                console.log(`Creating ${role} user: ${email}`);
                
                // First, check what columns actually exist in the users table
                const tableInfoResult = await client.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'users'
                `);
                
                const columnNames = tableInfoResult.rows.map(row => row.column_name);
                console.log('Available columns in users table:', columnNames);
                
                // Determine if we're using first_name/last_name or firstname/lastname
                const hasFirstName = columnNames.includes('first_name');
                const hasFirstNameCamel = columnNames.includes('firstname');
                
                let query;
                let queryParams;
                
                if (hasFirstName) {
                    // Use snake_case column names (first_name, last_name)
                    query = `
                        INSERT INTO users (
                            email, password_hash, first_name, last_name, role, phone
                        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
                    `;
                    queryParams = [email, hashedPassword, first_name, last_name, role, phone];
                } else if (hasFirstNameCamel) {
                    // Use camelCase column names (firstname, lastname)
                    query = `
                        INSERT INTO users (
                            email, password_hash, firstname, lastname, role, phone
                        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
                    `;
                    queryParams = [email, hashedPassword, first_name, last_name, role, phone];
                } else {
                    // If neither exists, throw an error with helpful information
                    throw new Error(`Database schema issue: neither first_name nor firstname columns found in users table. Available columns: ${columnNames.join(', ')}`);
                }
                
                const result = await client.query(query, queryParams);
                return new User(result.rows[0]);
            } catch (error) {
                this._handleDatabaseError(error, email);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._createInMemory(userData);
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
     * Find users by role
     */
    async findByRole(role) {
        try {
            const client = await pool.connect();
            try {
                const result = await client.query(
                    'SELECT * FROM users WHERE role = $1',
                    [role]
                );
                return result.rows.map(row => new User(row));
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._findByRoleInMemory(role);
            }
            throw error;
        }
    }
    
    /**
     * Update user information
     */
    async update(id, userData) {
        const { first_name, last_name, phone } = userData;
        
        try {
            const client = await pool.connect();
            try {
                const result = await client.query(
                    `UPDATE users 
                     SET first_name = $1, last_name = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
                     WHERE id = $4 RETURNING *`,
                    [first_name, last_name, phone, id]
                );
                
                return result.rows[0] ? new User(result.rows[0]) : null;
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._updateInMemory(id, userData);
            }
            throw error;
        }
    }
    
    /**
     * Delete a user by ID
     */
    async delete(id) {
        try {
            const client = await pool.connect();
            try {
                console.log(`Deleting user with ID: ${id}`);
                const result = await client.query(
                    'DELETE FROM users WHERE id = $1 RETURNING *',
                    [id]
                );
                return result.rowCount > 0;
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage');
                return this._deleteInMemory(id);
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
    
    async _createInMemory(userData) {
        const { email, password, first_name, last_name, role = 'patient', phone } = userData;
        console.log(`Using in-memory storage for user creation: ${email}`);
        
        if (memoryStore.users.some(user => user.email === email)) {
            throw new Error(`Email ${email} already exists`);
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: ++memoryStore.lastId,
            email,
            password_hash: hashedPassword,
            first_name: first_name || '',
            last_name: last_name || '',
            role,
            phone: phone || '',
            is_active: true,
            is_verified: false,
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
    
    _findByRoleInMemory(role) {
        const users = memoryStore.users.filter(user => user.role === role);
        return users.map(user => new User(user));
    }
    
    _updateInMemory(id, userData) {
        const index = memoryStore.users.findIndex(user => user.id === parseInt(id));
        if (index === -1) return null;
        
        memoryStore.users[index] = {
            ...memoryStore.users[index],
            ...userData,
            updated_at: new Date()
        };
        
        return new User(memoryStore.users[index]);
    }
    
    _deleteInMemory(id) {
        const index = memoryStore.users.findIndex(user => user.id === parseInt(id));
        if (index === -1) return false;
        
        memoryStore.users.splice(index, 1);
        console.log(`Deleted user ${id} from memory store`);
        return true;
    }
}

module.exports = new UserRepository();
