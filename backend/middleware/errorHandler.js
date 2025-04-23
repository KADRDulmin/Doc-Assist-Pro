/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    // Detailed logging for debugging
    console.error('=== ERROR HANDLER ===');
    console.error(`Path: ${req.method} ${req.path}`);
    console.error(`Error name: ${err.name}`);
    console.error(`Error message: ${err.message}`);
    console.error(`Stack trace: ${err.stack}`);
    
    if (req.body && Object.keys(req.body).length > 0) {
        // Don't log passwords
        const sanitizedBody = { ...req.body };
        if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
        if (sanitizedBody.confirmPassword) sanitizedBody.confirmPassword = '[REDACTED]';
        console.error('Request body:', JSON.stringify(sanitizedBody, null, 2));
    }
    
    // Default error status and message
    let statusCode = 500;
    let message = 'Internal server error';
    
    // Customize based on error type
    if (err.message.includes('already exists')) {
        statusCode = 409; // Conflict
        message = err.message;
    } else if (err.message.includes('required') || err.message.includes('Invalid email format') || err.message.includes('Password must be')) {
        statusCode = 400; // Bad Request
        message = err.message;
    } else if (err.message.includes('Invalid credentials')) {
        statusCode = 401; // Unauthorized
        message = 'Invalid credentials';
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        statusCode = 503; // Service Unavailable
        message = 'Database service unavailable. Using fallback storage.';
    }
    
    // Include more details in development mode
    const isDev = process.env.NODE_ENV !== 'production';
    
    // Send error response
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(isDev && { 
            details: err.message,
            stack: err.stack?.split('\n').map(line => line.trim())
        })
    });
};

module.exports = errorHandler;
