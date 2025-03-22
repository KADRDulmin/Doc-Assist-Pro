const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// GET routes for testing in browser (will show error)
router.get('/register', (req, res) => {
    res.status(405).json({ error: 'Method not allowed. Please use POST for registration.' });
});
router.get('/login', (req, res) => {
    res.status(405).json({ error: 'Method not allowed. Please use POST for login.' });
});

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
