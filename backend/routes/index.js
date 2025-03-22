const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const { checkConnection } = require('../config/database');

// API info route
router.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to Doc-Assist-Pro API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            health: '/api/health',
            auth: {
                register: '/api/auth/register',
                login: '/api/auth/login',
                profile: '/api/auth/me'
            }
        }
    });
});

// CORS test endpoint
router.get('/cors-test', (req, res) => {
    res.json({
        success: true,
        message: 'CORS is working correctly',
        clientOrigin: req.headers.origin || 'Unknown',
        serverTime: new Date().toISOString()
    });
});

// Health check route
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Database health check route
router.get('/health/db', async (req, res) => {
    try {
        const isConnected = await checkConnection();
        if (isConnected) {
            res.json({ 
                status: 'ok', 
                message: 'Database connection successful',
                dbHost: process.env.PGHOST || 'localhost'
            });
        } else {
            res.status(500).json({ 
                status: 'error', 
                message: 'Database connection failed' 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
});

// Auth routes
router.use('/auth', authRoutes);

module.exports = router;
