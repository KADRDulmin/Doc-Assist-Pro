/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);
    
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
    
    // Send error response
    res.status(statusCode).json({
        success: false,
        error: message
    });
};

module.exports = errorHandler;
