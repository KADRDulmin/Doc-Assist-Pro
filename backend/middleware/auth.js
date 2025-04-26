const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');
const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 * Automatically refreshes tokens that are close to expiration
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
        let decoded;
        let needsRefresh = false;
        
        try {
            // First try normal verification
            decoded = authService.verifyToken(token);
        } catch (error) {
            if (error.message === 'Token expired') {
                try {
                    // If token is expired, try to verify without checking expiration
                    decoded = authService.verifyToken(token, true);
                    const expiryTime = new Date(decoded.exp * 1000);
                    const now = new Date();
                    
                    // If token expired less than 7 days ago, allow refresh
                    const daysSinceExpiry = (now - expiryTime) / (1000 * 60 * 60 * 24);
                    if (daysSinceExpiry <= 7) {
                        needsRefresh = true;
                    } else {
                        return res.status(401).json({ 
                            success: false,
                            error: 'Token expired long ago. Please login again.' 
                        });
                    }
                } catch (innerError) {
                    return res.status(401).json({ 
                        success: false,
                        error: 'Invalid authentication. Please login again.' 
                    });
                }
            } else {
                return res.status(401).json({ 
                    success: false,
                    error: 'Invalid authentication. Please login again.' 
                });
            }
        }
        
        // Check if token will expire soon (within 1 hour)
        if (!needsRefresh && decoded.exp) {
            const expiryTime = new Date(decoded.exp * 1000);
            const now = new Date();
            const timeUntilExpiry = expiryTime - now;
            
            // If token expires in less than 1 hour, refresh it
            if (timeUntilExpiry < 3600 * 1000) {
                needsRefresh = true;
            }
        }
        
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
        
        // If token needs refresh, generate a new one and send in response header
        if (needsRefresh) {
            const newToken = authService.generateToken(user);
            res.set('X-New-Token', newToken);
        }
        
        next();
    } catch (error) {
        console.error('Authentication error:', error.message);
        res.status(401).json({ 
            success: false,
            error: 'Invalid authentication. Please login again.' 
        });
    }
};

module.exports = {
    authenticate
};
