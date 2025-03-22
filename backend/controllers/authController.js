const bcrypt = require('bcryptjs'); // Changed from bcrypt to bcryptjs
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Make email service optional
let emailService;
try {
    emailService = require('../services/emailService');
} catch (error) {
    console.log('Email service not available, skipping email functionality');
    emailService = { sendVerificationEmail: () => console.log('Email sending skipped') };
}

const registerController = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    
    try {
        console.log(`Attempting to register user with email: ${email}`);
        await User.registerUser(email, password);
        
        // Optional: Send verification email 
        emailService.sendVerificationEmail && emailService.sendVerificationEmail(email);
        
        console.log(`User registered successfully: ${email}`);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error.message);
        
        // Check for specific database errors
        if (error.code === '23505') { // PostgreSQL unique constraint violation
            return res.status(409).json({ error: 'Email already exists' });
        }
        
        res.status(500).json({ error: 'Failed to register user. ' + error.message });
    }
};

const loginController = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    
    try {
        const user = await User.getUserByEmail(email);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ error: 'Login failed. ' + error.message });
    }
};

module.exports = { registerController, loginController };