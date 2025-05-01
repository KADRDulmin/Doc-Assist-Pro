const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const doctorRoutes = require('./doctorRoutes');
const patientRoutes = require('./patientRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const healthTipRoutes = require('./healthTipRoutes');
const consultationRoutes = require('./consultationRoutes');
const medicalRecordRoutes = require('./medicalRecordRoutes');
const prescriptionRoutes = require('./prescriptionRoutes');
const uploadRoutes = require('./uploadRoutes');
const { checkConnection } = require('../config/database');

// API info route
router.get('/', (req, res) => {
    res.json({
        name: 'Doc-Assist-Pro API',
        version: '1.0.0',
        description: 'RESTful API for healthcare management',
        endpoints: {
            auth: '/api/auth',
            doctors: '/api/doctors',
            patients: '/api/patients',
            appointments: '/api/appointments',
            consultations: '/api/consultations',
            medicalRecords: '/api/medical-records',
            prescriptions: '/api/prescriptions',
            feedback: '/api/feedback',
            healthTips: '/api/health-tips',
            uploads: '/api/uploads',
            health: '/api/health'
        }
    });
});

// Health check routes
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

router.get('/health/db', async (req, res) => {
    try {
        const dbStatus = await checkConnection();
        res.json({
            status: dbStatus ? 'ok' : 'error',
            message: dbStatus ? 'Database connection successful' : 'Database connection failed',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: `Database health check failed: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Enhanced health check endpoint for debugging
router.get('/health/debug', async (req, res) => {
    try {
        const { pool } = require('../config/database');
        const userRepository = require('../repositories/userRepository');
        
        // Test database connection
        let dbConnection = false;
        try {
            const client = await pool.connect();
            await client.query('SELECT 1 as test');
            client.release();
            dbConnection = true;
        } catch (dbError) {
            console.error('Database connection test failed:', dbError.message);
        }
        
        // Check environment variables
        const envVars = {
            NODE_ENV: process.env.NODE_ENV || 'not set',
            PORT: process.env.PORT || 'not set',
            PGHOST: process.env.PGHOST || 'not set',
            PGDATABASE: process.env.PGDATABASE || 'not set',
            JWT_SECRET: process.env.JWT_SECRET ? 'set (length: ' + process.env.JWT_SECRET.length + ')' : 'not set',
            DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set'
        };
        
        // Additional checks
        const healthStatus = {
            server: true,
            database: dbConnection,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: envVars,
            memory_usage: process.memoryUsage(),
            api_version: '1.0.0'
        };
        
        res.json({
            success: true,
            data: healthStatus
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
        });
    }
});

// CORS test endpoint
router.get('/cors-test', (req, res) => {
    res.json({
        success: true,
        message: 'CORS is configured correctly',
        origin: req.headers.origin || 'Unknown origin',
        headers: req.headers['access-control-request-headers'] || 'No headers specified'
    });
});

// Special debug route to test endpoint registration
router.post('/debug/test-doctor', (req, res) => {
    console.log('Debug test doctor route accessed');
    res.json({
        success: true,
        message: 'Debug doctor test route is working',
        body: req.body
    });
});

// Route order check
router.get('/routes-check', (req, res) => {
    const routes = [];
    
    router.stack.forEach((middleware) => {
        if(middleware.route){ // routes registered directly on the router
            const path = middleware.route.path;
            const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
            routes.push(`${methods} ${path}`);
        } else if(middleware.name === 'router'){ // router middleware
            middleware.handle.stack.forEach((handler) => {
                if(handler.route){
                    const path = handler.route.path;
                    const methods = Object.keys(handler.route.methods).join(', ').toUpperCase();
                    routes.push(`${methods} ${middleware.path}${path}`);
                }
            });
        }
    });
    
    res.json({
        success: true,
        routes: routes
    });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/doctors', doctorRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/consultations', consultationRoutes);
router.use('/medical-records', medicalRecordRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/health-tips', healthTipRoutes);
router.use('/uploads', uploadRoutes);

module.exports = router;
