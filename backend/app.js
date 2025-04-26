const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { initializeDatabase } = require('./database/init');
const appointmentScheduler = require('./services/appointmentScheduler');

// Load environment variables
dotenv.config();
const app = express();

// Configure CORS
const getAllowedOrigins = () => {
    // Add all possible origins that might connect to this backend
    const origins = [
        process.env.FRONTEND_URL || 'http://localhost:19006',
        'http://localhost:3000',
        'http://localhost:19000',
        'http://localhost:19001',
        'http://localhost:19002',
        'http://localhost:8081',
        'http://frontend:19006',  // Docker service name
        'http://127.0.0.1:19006',
        'http://172.17.0.1:19006', // Docker default bridge network
        'http://192.168.1.4:19006', // Local network IP
        'http://192.168.1.4:19000', // Local network IP for Expo
        'exp://192.168.1.4:19000', // Expo Go URL format
        // Wildcard entries for development
        'http://192.168.*.*:19000',
        'http://192.168.*.*:19006',
        'exp://192.168.*.*:19000',
        'http://0.0.0.0:19006',
        // Allow connections from all origins in development
        '*'
    ];
    
    console.log('CORS: Allowed origins configured as:', origins);
    return origins;
};

// CORS middleware with precise configuration
app.use(cors({
    origin: function(origin, callback) {
        // Allow all origins during development for mobile testing
        if (process.env.NODE_ENV === 'development') {
            console.log(`CORS: Development mode - allowing origin: ${origin}`);
            return callback(null, true);
        }
        
        // Get origins list
        const allowedOrigins = getAllowedOrigins();
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('CORS: Allowing request with no origin');
            return callback(null, true);
        }
        
        // Log the request origin
        console.log(`CORS: Request from origin: ${origin}`);
        
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*') || !origin) {
            // Origin is allowed
            console.log(`CORS: Origin ${origin} is allowed`);
            callback(null, origin);
        } else {
            // Origin not allowed but allow anyway in development for easier debugging
            console.log(`CORS: Origin ${origin} is not in the allowed list, but allowing in development`);
            callback(null, true);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Increase JSON request body limit to handle larger payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware with request body
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// API Routes
app.use('/api', routes);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`API is accessible at http://localhost:${PORT}/api`);
    
    // Log environment information
    console.log('Environment configuration:');
    console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`- PORT: ${PORT}`);
    console.log(`- Database host: ${process.env.PGHOST}`);
    console.log(`- Database name: ${process.env.PGDATABASE}`);
    
    // Initialize database in background
    try {
        await initializeDatabase();
        
        // Start the appointment scheduler after database is initialized
        appointmentScheduler.startScheduling(15); // Check every 15 minutes
        console.log('Appointment scheduler started - checking for missed appointments every 15 minutes');
    } catch (error) {
        console.error('Database initialization error:', error.message);
        console.log('Server will continue running with potential fallback to in-memory storage');
    }
    
    // Add health check info
    console.log(`\nAPI health check: http://localhost:${PORT}/api/health`);
    console.log(`Database health check: http://localhost:${PORT}/api/health/db`);
    
    // Add startup instructions
    if (process.env.NODE_ENV === 'production') {
        console.log('\nRunning in production mode');
        console.log('API origins allowed:', getAllowedOrigins());
    } else {
        console.log('\nRunning in development mode');
        console.log('For containerized deployment:');
        console.log('1. Run: docker-compose up --build');
    }
});