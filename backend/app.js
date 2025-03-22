const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { registerController, loginController } = require('./controllers/authController');
const User = require('./models/user');

dotenv.config();
const app = express();

// Get allowed origins based on environment
const getAllowedOrigins = () => {
    const origins = [
        process.env.FRONTEND_URL || 'http://localhost:19006',
        'http://localhost:3000'
    ];
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
        return '*';
    }
    
    return origins;
};

// Enhanced CORS configuration with dynamic origins
app.use(cors({
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Root route with environment info
app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to Doc-Assist-Pro API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            health: '/api/health',
            register: '/api/auth/register',
            login: '/api/auth/login'
        }
    });
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Database health check route
app.get('/api/health/db', async (req, res) => {
    try {
        const isConnected = await User.checkDatabaseConnection();
        if (isConnected) {
            res.json({ 
                status: 'ok', 
                message: 'Database connection successful',
                dbHost: process.env.PGHOST || 'localhost'
            });
        } else {
            res.status(500).json({ status: 'error', message: 'Database connection failed' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Auth routes
app.post('/api/auth/register', registerController);
app.post('/api/auth/login', loginController);
// Also allow GET requests for testing in browser
app.get('/api/auth/register', (req, res) => {
    res.status(405).json({ error: 'Method not allowed. Please use POST for registration.' });
});
app.get('/api/auth/login', (req, res) => {
    res.status(405).json({ error: 'Method not allowed. Please use POST for login.' });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    
    // Check for database connection errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        return res.status(503).json({ 
            error: 'Database service unavailable', 
            message: 'The database is currently unavailable. Using in-memory storage as fallback.' 
        });
    }
    
    res.status(500).json({ 
        error: 'Internal server error', 
        message: err.message 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`API is accessible at http://localhost:${PORT}`);
    console.log('Environment configuration:');
    console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`- PORT: ${PORT}`);
    console.log(`- Database host: ${process.env.PGHOST}`);
    console.log(`- Database name: ${process.env.PGDATABASE}`);
    
    // Add health check info
    console.log(`\nAPI health check: http://localhost:${PORT}/api/health`);
    console.log(`Database health check: http://localhost:${PORT}/api/health/db`);
    
    // Add startup instructions for containers
    if (process.env.NODE_ENV === 'production') {
        console.log('\nRunning in production mode');
        console.log('API origins allowed:', getAllowedOrigins());
    } else {
        console.log('\nRunning in development mode');
        console.log('For containerized deployment:');
        console.log('1. Run: docker-compose up --build');
    }
});