const { pool } = require('../config/database');
const HealthTip = require('../models/health-tip');
const memoryStore = require('../utils/memoryStore');

/**
 * Health Tip Repository - Handles health tip data access
 */
class HealthTipRepository {
    /**
     * Get all health tips
     * @param {Object} options - Filter and pagination options
     * @returns {Promise<HealthTip[]>} Array of health tips
     */
    async getAllTips(options = {}) {
        const { category, limit = 10, offset = 0 } = options;
        
        try {
            const client = await pool.connect();
            
            try {
                let query = 'SELECT * FROM health_tips';
                const queryParams = [];
                
                // Add category filter if provided
                if (category) {
                    query += ' WHERE category = $1';
                    queryParams.push(category);
                }
                
                // Add ordering
                query += ' ORDER BY created_at DESC';
                
                // Add pagination
                query += ` LIMIT ${limit} OFFSET ${offset}`;
                
                const result = await client.query(query, queryParams);
                
                return result.rows.map(row => new HealthTip(row));
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage for health tips');
                return this._getAllTipsInMemory(options);
            }
            throw error;
        }
    }
    
    /**
     * Get a random health tip
     * @param {Object} options - Filter options
     * @returns {Promise<HealthTip>} A random health tip
     */
    async getRandomTip(options = {}) {
        const { category } = options;
        
        try {
            const client = await pool.connect();
            
            try {
                let query = 'SELECT * FROM health_tips';
                const queryParams = [];
                
                // Add category filter if provided
                if (category) {
                    query += ' WHERE category = $1';
                    queryParams.push(category);
                }
                
                // Add random ordering
                query += ' ORDER BY RANDOM()';
                
                // Return just one tip
                query += ' LIMIT 1';
                
                const result = await client.query(query, queryParams);
                
                if (result.rows.length === 0) {
                    return null;
                }
                
                return new HealthTip(result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage for random health tip');
                return this._getRandomTipInMemory(options);
            }
            throw error;
        }
    }
    
    /**
     * Get multiple random health tips
     * @param {Object} options - Filter options and count
     * @returns {Promise<HealthTip[]>} Array of random health tips
     */
    async getRandomTips(options = {}) {
        const { category, count = 3 } = options;
        
        try {
            const client = await pool.connect();
            
            try {
                // Check if the health_tips table exists
                const tableCheck = await client.query(`
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name = 'health_tips'
                    );
                `);
                
                if (!tableCheck.rows[0].exists) {
                    console.warn('Health tips table does not exist yet');
                    // If table doesn't exist, use in-memory data instead
                    return this._getRandomTipsInMemory(options);
                }
                
                let query = 'SELECT * FROM health_tips';
                const queryParams = [];
                
                // Add category filter if provided
                if (category) {
                    query += ' WHERE category = $1';
                    queryParams.push(category);
                }
                
                // Add random ordering
                query += ' ORDER BY RANDOM()';
                
                // Return requested number of tips
                query += ` LIMIT ${count}`;
                
                const result = await client.query(query, queryParams);
                
                return result.rows.map(row => new HealthTip(row));
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error in getRandomTips:', error.message);
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage for random health tips');
                return this._getRandomTipsInMemory(options);
            }
            throw error;
        }
    }
    
    /**
     * Get a health tip by ID
     * @param {number} id - The health tip ID
     * @returns {Promise<HealthTip|null>} The health tip or null if not found
     */
    async getTipById(id) {
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    'SELECT * FROM health_tips WHERE id = $1',
                    [id]
                );
                
                if (result.rows.length === 0) {
                    return null;
                }
                
                return new HealthTip(result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage for health tip by ID');
                return this._getTipByIdInMemory(id);
            }
            throw error;
        }
    }
    
    /**
     * Add a new health tip
     * @param {Object} tipData - The health tip data
     * @returns {Promise<HealthTip>} The created health tip
     */
    async createTip(tipData) {
        const { title, content, category, image_url, source } = tipData;
        
        if (!title || !content || !category) {
            throw new Error('Title, content, and category are required');
        }
        
        // Validate category
        const validCategories = HealthTip.getCategories();
        if (!validCategories.includes(category)) {
            throw new Error(`Invalid category. Valid options are: ${validCategories.join(', ')}`);
        }
        
        try {
            const client = await pool.connect();
            
            try {
                const result = await client.query(
                    `INSERT INTO health_tips (
                        title, content, category, image_url, source, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING *`,
                    [title, content, category, image_url, source]
                );
                
                return new HealthTip(result.rows[0]);
            } finally {
                client.release();
            }
        } catch (error) {
            if (this._isConnectionError(error)) {
                console.warn('Database connection failed, using in-memory storage for creating health tip');
                return this._createTipInMemory(tipData);
            }
            throw error;
        }
    }
    
    /**
     * Helper method to check for connection errors
     */
    _isConnectionError(error) {
        return error.message.includes('ECONNREFUSED') || 
            error.message.includes('connection refused') ||
            error.message.includes('no pg_hba.conf entry');
    }
    
    /**
     * Get all health tips from memory store
     */
    _getAllTipsInMemory(options = {}) {
        const { category, limit = 10, offset = 0 } = options;
        
        // Initialize health tips if not already in memory store
        if (!memoryStore.healthTips) {
            this._initializeInMemoryTips();
        }
        
        let tips = [...memoryStore.healthTips];
        
        // Apply category filter if provided
        if (category) {
            tips = tips.filter(tip => tip.category === category);
        }
        
        // Sort by created_at in descending order
        tips.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Apply pagination
        return tips.slice(offset, offset + limit).map(tip => new HealthTip(tip));
    }
    
    /**
     * Get a random health tip from memory store
     */
    _getRandomTipInMemory(options = {}) {
        const { category } = options;
        
        // Initialize health tips if not already in memory store
        if (!memoryStore.healthTips) {
            this._initializeInMemoryTips();
        }
        
        let tips = [...memoryStore.healthTips];
        
        // Apply category filter if provided
        if (category) {
            tips = tips.filter(tip => tip.category === category);
        }
        
        if (tips.length === 0) {
            return null;
        }
        
        // Get a random tip
        const randomIndex = Math.floor(Math.random() * tips.length);
        return new HealthTip(tips[randomIndex]);
    }
    
    /**
     * Get multiple random health tips from memory store
     */
    _getRandomTipsInMemory(options = {}) {
        const { category, count = 3 } = options;
        
        // Initialize health tips if not already in memory store
        if (!memoryStore.healthTips) {
            this._initializeInMemoryTips();
        }
        
        let tips = [...memoryStore.healthTips];
        
        // Apply category filter if provided
        if (category) {
            tips = tips.filter(tip => tip.category === category);
        }
        
        // Shuffle tips
        for (let i = tips.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tips[i], tips[j]] = [tips[j], tips[i]];
        }
        
        // Return requested number of tips
        return tips.slice(0, count).map(tip => new HealthTip(tip));
    }
    
    /**
     * Get a health tip by ID from memory store
     */
    _getTipByIdInMemory(id) {
        // Initialize health tips if not already in memory store
        if (!memoryStore.healthTips) {
            this._initializeInMemoryTips();
        }
        
        const tip = memoryStore.healthTips.find(t => t.id === parseInt(id));
        return tip ? new HealthTip(tip) : null;
    }
    
    /**
     * Create a health tip in memory store
     */
    _createTipInMemory(tipData) {
        // Initialize health tips if not already in memory store
        if (!memoryStore.healthTips) {
            this._initializeInMemoryTips();
        }
        
        const newTip = {
            id: memoryStore.healthTips.length + 1,
            title: tipData.title,
            content: tipData.content,
            category: tipData.category,
            image_url: tipData.image_url || null,
            source: tipData.source || null,
            created_at: new Date(),
            updated_at: new Date()
        };
        
        memoryStore.healthTips.push(newTip);
        return new HealthTip(newTip);
    }
    
    /**
     * Initialize in-memory health tips with sample data
     */
    _initializeInMemoryTips() {
        console.log('Initializing in-memory health tips');
        
        memoryStore.healthTips = [
            {
                id: 1,
                title: 'Stay Hydrated',
                content: 'Drink at least 8 glasses of water a day to stay hydrated and maintain optimal bodily functions.',
                category: 'General Wellness',
                image_url: null,
                source: null,
                created_at: new Date('2024-05-10'),
                updated_at: new Date('2024-05-10')
            },
            {
                id: 2,
                title: 'Boost Your Immune System with Vitamin C',
                content: 'Citrus fruits like oranges, grapefruits, and lemons are high in vitamin C, which helps strengthen your immune system.',
                category: 'Nutrition',
                image_url: null,
                source: null,
                created_at: new Date('2024-05-11'),
                updated_at: new Date('2024-05-11')
            },
            {
                id: 3,
                title: 'Benefits of Regular Physical Activity',
                content: 'Just 30 minutes of moderate exercise five times a week can improve your cardiovascular health and reduce stress.',
                category: 'Exercise',
                image_url: null,
                source: null,
                created_at: new Date('2024-05-12'),
                updated_at: new Date('2024-05-12')
            },
            {
                id: 4,
                title: 'Practice Mindfulness for Mental Well-being',
                content: 'Take 10 minutes each day to practice mindfulness or meditation to reduce anxiety and improve focus.',
                category: 'Mental Health',
                image_url: null,
                source: null,
                created_at: new Date('2024-05-13'),
                updated_at: new Date('2024-05-13')
            },
            {
                id: 5,
                title: 'Importance of Quality Sleep',
                content: 'Adults should aim for 7-9 hours of quality sleep per night for optimal physical and mental health.',
                category: 'Sleep',
                image_url: null,
                source: null,
                created_at: new Date('2024-05-14'),
                updated_at: new Date('2024-05-14')
            },
            {
                id: 6,
                title: 'Regular Health Check-ups',
                content: 'Schedule regular check-ups with your doctor even when you feel healthy to catch potential issues early.',
                category: 'Preventive Care',
                image_url: null,
                source: null,
                created_at: new Date('2024-05-15'),
                updated_at: new Date('2024-05-15')
            }
        ];
    }
}

module.exports = new HealthTipRepository();