const healthTipRepository = require('../repositories/healthTipRepository');

/**
 * Health Tip Controller - Handles health tip-related requests
 */
class HealthTipController {
    /**
     * Get all health tips with optional filtering
     */
    async getAllTips(req, res, next) {
        try {
            const { category } = req.query;
            const limit = parseInt(req.query.limit) || 10;
            const page = parseInt(req.query.page) || 1;
            const offset = (page - 1) * limit;
            
            const tips = await healthTipRepository.getAllTips({
                category,
                limit,
                offset
            });
            
            res.json({
                success: true,
                data: tips,
                pagination: {
                    page,
                    limit,
                    totalItems: tips.length // This is approximate since we don't have a count query
                }
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Get a random health tip
     */
    async getRandomTip(req, res, next) {
        try {
            const { category } = req.query;
            
            const tip = await healthTipRepository.getRandomTip({ category });
            
            if (!tip) {
                return res.status(404).json({
                    success: false,
                    error: 'No health tips found'
                });
            }
            
            res.json({
                success: true,
                data: tip
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Get multiple random health tips
     */
    async getRandomTips(req, res, next) {
        try {
            const { category } = req.query;
            const count = parseInt(req.query.count) || 3;
            
            const tips = await healthTipRepository.getRandomTips({
                category,
                count
            });
            
            res.json({
                success: true,
                data: tips,
                count: tips.length
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Get a specific health tip by ID
     */
    async getTipById(req, res, next) {
        try {
            const { tipId } = req.params;
            
            const tip = await healthTipRepository.getTipById(tipId);
            
            if (!tip) {
                return res.status(404).json({
                    success: false,
                    error: 'Health tip not found'
                });
            }
            
            res.json({
                success: true,
                data: tip
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Create a new health tip (admin only)
     */
    async createTip(req, res, next) {
        try {
            const { title, content, category, image_url, source } = req.body;
            
            if (!title || !content || !category) {
                return res.status(400).json({
                    success: false,
                    error: 'Title, content, and category are required'
                });
            }
            
            const newTip = await healthTipRepository.createTip({
                title,
                content,
                category,
                image_url,
                source
            });
            
            res.status(201).json({
                success: true,
                message: 'Health tip created successfully',
                data: newTip
            });
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Get valid health tip categories
     */
    async getCategories(req, res) {
        try {
            const HealthTip = require('../models/health-tip');
            const categories = HealthTip.getCategories();
            
            res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch categories',
                message: error.message
            });
        }
    }
}

module.exports = new HealthTipController();