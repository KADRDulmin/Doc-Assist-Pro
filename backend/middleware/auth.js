const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');
const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 * Automatically refreshes tokens that are close to expiration
 */
const authenticate = async (req, res, next) => {
    console.log(`[AUTH MIDDLEWARE] Authenticating request to ${req.method} ${req.originalUrl}`);
    
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('[AUTH MIDDLEWARE] No valid auth header found');
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
            console.log(`[AUTH MIDDLEWARE] Token verified for user ID: ${decoded.userId}`);
        } catch (error) {
            console.log(`[AUTH MIDDLEWARE] Token verification error: ${error.message}`);
            
            if (error.message === 'Token expired') {
                console.log('[AUTH MIDDLEWARE] Token expired, attempting to verify without expiration check');
                
                try {
                    // If token is expired, try to verify without checking expiration
                    decoded = authService.verifyToken(token, true);
                    const expiryTime = new Date(decoded.exp * 1000);
                    const now = new Date();
                    
                    // If token expired less than 7 days ago, allow refresh
                    const daysSinceExpiry = (now - expiryTime) / (1000 * 60 * 60 * 24);
                    console.log(`[AUTH MIDDLEWARE] Token expired ${daysSinceExpiry.toFixed(2)} days ago`);
                    
                    if (daysSinceExpiry <= 7) {
                        needsRefresh = true;
                        console.log('[AUTH MIDDLEWARE] Token will be refreshed');
                    } else {
                        console.log('[AUTH MIDDLEWARE] Token expired too long ago');
                        return res.status(401).json({ 
                            success: false,
                            error: 'Token expired long ago. Please login again.' 
                        });
                    }
                } catch (innerError) {
                    console.error('[AUTH MIDDLEWARE] Failed to verify expired token:', innerError);
                    return res.status(401).json({ 
                        success: false,
                        error: 'Invalid authentication. Please login again.' 
                    });
                }
            } else {
                console.error('[AUTH MIDDLEWARE] Invalid token:', error);
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
            const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);
            
            console.log(`[AUTH MIDDLEWARE] Token expires in ${hoursUntilExpiry.toFixed(2)} hours`);
            
            // If token expires in less than 1 hour, refresh it
            if (timeUntilExpiry < 3600 * 1000) {
                needsRefresh = true;
                console.log('[AUTH MIDDLEWARE] Token will be refreshed (expires soon)');
            }
        }
        
        // Get user from database
        console.log(`[AUTH MIDDLEWARE] Finding user with ID: ${decoded.userId}`);
        const user = await userRepository.findById(decoded.userId);
        
        if (!user) {
            console.log(`[AUTH MIDDLEWARE] User with ID ${decoded.userId} not found`);
            return res.status(401).json({ 
                success: false,
                error: 'User not found. Please login again.' 
            });
        }
        
        console.log(`[AUTH MIDDLEWARE] User found: ${user.id} (${user.email})`);
        
        // Check if user is active
        if (!user.is_active) {
            console.log(`[AUTH MIDDLEWARE] User ${user.id} is inactive`);
            return res.status(403).json({
                success: false,
                error: 'Account is inactive. Please contact support.'
            });
        }
        
        // Attach user to request
        req.user = user.toJSON();
        req.token = token;
        
        // If token needs refresh, generate a new one and send in response header
        if (needsRefresh) {
            const newToken = authService.generateToken(user);
            res.set('X-New-Token', newToken);
            console.log(`[AUTH MIDDLEWARE] Generated new token for user ${user.id}`);
        }
        
        console.log(`[AUTH MIDDLEWARE] Authentication successful for user ${user.id}`);
        next();
    } catch (error) {
        console.error('[AUTH MIDDLEWARE] Unexpected authentication error:', error);
        res.status(401).json({ 
            success: false,
            error: 'Invalid authentication. Please login again.' 
        });
    }
};

module.exports = {
    authenticate
};
