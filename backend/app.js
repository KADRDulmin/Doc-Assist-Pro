const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { initializeDatabase } = require('./database/init');

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
        'http://192.168.0.1:19006', // Local network
        'http://0.0.0.0:19006'
    ];
    
    console.log('CORS: Allowed origins configured as:', origins);
    return origins;
};

// CORS middleware with precise configuration
app.use(cors({
    origin: function(origin, callback) {
        // Get origins list
        const allowedOrigins = getAllowedOrigins();
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('CORS: Allowing request with no origin');
            return callback(null, true);
        }
        
        // Log the request origin
        console.log(`CORS: Request from origin: ${origin}`);
        
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            // Origin is allowed
            console.log(`CORS: Origin ${origin} is allowed`);
            callback(null, origin);
        } else {
            // Origin not allowed
            console.log(`CORS: Origin ${origin} is not allowed`);
            callback(null, allowedOrigins[0]); // Default to first allowed origin
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
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