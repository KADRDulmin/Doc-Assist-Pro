const express = require('express');
const router = express.Router();
const healthTipController = require('../controllers/healthTipController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleAuth');

// Public routes
router.get('/', healthTipController.getAllTips);
router.get('/random', healthTipController.getRandomTip);
router.get('/random-multiple', healthTipController.getRandomTips);
router.get('/categories', healthTipController.getCategories);
router.get('/:tipId', healthTipController.getTipById);

// Admin-only routes
router.post('/', authenticate, requireAdmin, healthTipController.createTip);

module.exports = router;