/**
 * Role-based authorization middleware
 * Extends the authentication middleware to handle role restrictions
 */

/**
 * Role authorization middleware
 * Checks if the authenticated user has the required role
 * 
 * @param {string|string[]} allowedRoles - Role(s) allowed to access the route
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        // User must already be authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        
        // Convert single role to array for consistent handling
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        
        // Check if user has one of the required roles
        if (roles.includes(req.user.role)) {
            return next();
        }
        
        // Deny access if roles don't match
        return res.status(403).json({
            success: false,
            error: 'Access forbidden. Insufficient permissions.'
        });
    };
};

/**
 * Admin-only middleware
 */
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    
    return res.status(403).json({
        success: false,
        error: 'Admin access required'
    });
};

/**
 * Doctor-only middleware
 */
const requireDoctor = (req, res, next) => {
    if (req.user && req.user.role === 'doctor') {
        return next();
    }
    
    return res.status(403).json({
        success: false,
        error: 'Doctor access required'
    });
};

/**
 * Patient-only middleware
 */
const requirePatient = (req, res, next) => {
    if (req.user && req.user.role === 'patient') {
        return next();
    }
    
    return res.status(403).json({
        success: false,
        error: 'Patient access required'
    });
};

/**
 * Self or admin middleware
 * Ensures a user can only access their own resources unless they're an admin
 */
const requireSelfOrAdmin = (req, res, next) => {
    // User must be authenticated
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    
    // Check if user is accessing their own resource or is an admin
    const requestedUserId = parseInt(req.params.userId || req.params.id);
    
    if (req.user.id === requestedUserId || req.user.role === 'admin') {
        return next();
    }
    
    return res.status(403).json({
        success: false,
        error: 'Access forbidden. You can only access your own resources.'
    });
};

module.exports = {
    requireRole,
    requireAdmin,
    requireDoctor,
    requirePatient,
    requireSelfOrAdmin
};
