const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');

// Optional email service
let emailService;
try {
    emailService = require('../services/emailService');
} catch (error) {
    console.log('Email service not available, skipping email functionality');
    emailService = { sendVerificationEmail: () => console.log('Email sending skipped') };
}

/**
 * Authentication Controller
 */
class AuthController {
    /**
     * Register a new user
     */
    async register(req, res, next) {
        try {
            const { email, password, first_name, last_name, role, phone } = req.body;
            
            // Attempt to register user
            const user = await authService.register({ 
                email, password, first_name, last_name, role, phone 
            });
            
            // Send verification email
            emailService.sendVerificationEmail && emailService.sendVerificationEmail(email);
            
            console.log(`User registered successfully: ${email} (${role || 'patient'})`);
            res.status(201).json({ 
                success: true,
                message: 'User registered successfully',
                data: user.toJSON()
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Login user
     */
    async login(req, res, next) {
        try {
            console.log('[AUTH CONTROLLER] Login request received');
            const { email, password } = req.body;
            
            console.log(`[AUTH CONTROLLER] Attempting login for email: ${email}`);
            
            // Validate input on controller level first
            if (!email || !password) {
                console.log('[AUTH CONTROLLER] Login failed: Missing email or password');
                return res.status(400).json({
                    success: false,
                    error: 'Email and password are required'
                });
            }
            
            try {
                // Attempt to login user
                const { token, user } = await authService.login(email, password);
                
                console.log(`[AUTH CONTROLLER] Login successful for user: ${user.id}`);
                
                return res.json({ 
                    success: true,
                    token,
                    user
                });
            } catch (authError) {
                console.error('[AUTH CONTROLLER] Authentication error:', authError.message);
                
                // Provide specific status codes for different error types
                if (authError.message.includes('Invalid credentials')) {
                    return res.status(401).json({
                        success: false,
                        error: 'Invalid credentials. Please check your email and password.'
                    });
                } else if (authError.message.includes('inactive')) {
                    return res.status(403).json({
                        success: false,
                        error: 'Account is inactive. Please contact support.'
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        error: authError.message
                    });
                }
            }
        } catch (error) {
            console.error('[AUTH CONTROLLER] Unexpected error in login:', error);
            next(error);
        }
    }
    
    /**
     * Refresh auth token
     */
    async refreshToken(req, res, next) {
        try {
            const { token } = req.body;
            
            if (!token) {
                return res.status(400).json({
                    success: false,
                    error: 'Token is required'
                });
            }
            
            try {
                // Try to refresh the token
                const newToken = authService.refreshToken(token);
                
                res.json({
                    success: true,
                    message: 'Token refreshed successfully',
                    token: newToken
                });
            } catch (error) {
                // If token can't be refreshed, return 401
                return res.status(401).json({
                    success: false,
                    error: error.message
                });
            }
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Logout user
     */
    async logout(req, res, next) {
        try {
            const userId = req.user.id;
            
            // Logout user
            await authService.logout(userId);
            
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Get current user
     */
    async getCurrentUser(req, res, next) {
        try {
            // User is already attached to request in auth middleware
            res.json({
                success: true,
                user: req.user
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();