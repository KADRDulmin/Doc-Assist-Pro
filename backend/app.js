const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { initializeDatabase } = require('./database/init');
const appointmentScheduler = require('./services/appointmentScheduler');

// Load environment variables
dotenv.config();

// Check for critical environment variables and set defaults if needed
if (!process.env.JWT_SECRET) {
    console.warn('⚠️ WARNING: JWT_SECRET environment variable not set!');
    console.warn('⚠️ Using a default secret for development. DO NOT USE IN PRODUCTION!');
    process.env.JWT_SECRET = 'dev-secret-key-change-me-in-production';
}

// Set JWT expiry if not defined
if (!process.env.JWT_EXPIRY) {
    console.log('Setting default JWT expiry to 24h');
    process.env.JWT_EXPIRY = '24h';
}

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

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug logging for static file serving
console.log(`Static files directory configured:`, path.join(__dirname, 'uploads'));
// Log the directory contents to verify structure
try {
    if (fs.existsSync(path.join(__dirname, 'uploads'))) {
        const mainDirContents = fs.readdirSync(path.join(__dirname, 'uploads'));
        console.log(`Uploads directory contents:`, mainDirContents);
        
        // Check subdirectories
        const subDirs = ['medical_records', 'prescriptions'];
        subDirs.forEach(subDir => {
            const fullPath = path.join(__dirname, 'uploads', subDir);
            if (fs.existsSync(fullPath)) {
                console.log(`${subDir} directory exists and contains: `, 
                    fs.readdirSync(fullPath).slice(0, 5).join(', ') + 
                    (fs.readdirSync(fullPath).length > 5 ? '...' : ''));
            } else {
                console.log(`${subDir} directory does not exist or is not accessible at: ${fullPath}`);
            }
        });
    } else {
        console.log(`Uploads directory does not exist at: ${path.join(__dirname, 'uploads')}`);
    }
} catch (error) {
    console.error(`Error checking uploads directory: ${error.message}`);
}

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