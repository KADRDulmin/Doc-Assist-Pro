const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false,
                error: 'Authentication required. Please login.' 
            });
        }
        
        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = authService.verifyToken(token);
        
        // Get user from database
        const user = await userRepository.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ 
                success: false,
                error: 'User not found. Please login again.' 
            });
        }
        
        // Attach user to request
        req.user = user.toJSON();
        req.token = token;
        
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false,
            error: 'Invalid authentication. Please login again.' 
        });
    }
};

module.exports = {
    authenticate
};
