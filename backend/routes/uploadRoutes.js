const express = require('express');
const router = express.Router();
const { createUploader, saveUploadedFile, saveBase64Image } = require('../utils/fileStorage');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');
const multer = require('multer');

// Create upload middleware for handling different types of uploads
const uploadMedicalRecord = createUploader('medical_record');
const uploadPrescription = createUploader('prescription');

/**
 * @route POST /api/uploads/medical-record
 * @desc Upload a medical record image (either multipart form or base64)
 * @access Private (doctors only)
 */
router.post(
    '/medical-record',
    authenticate,
    requireRole(['doctor']),
    (req, res, next) => {
        // Enhanced debugging
        console.log('Medical record upload request received');
        console.log('Content-Type:', req.headers['content-type']);
        console.log('Request has body?', !!req.body);
        
        // Check if request contains base64 image data
        if (req.headers['content-type']?.includes('application/json') && req.body?.image) {
            // This is a base64 upload request
            console.log('Processing as base64 image upload');
            try {
                const { image, filename } = req.body;
                
                if (!image || !image.startsWith('data:image/')) {
                    console.log('Invalid base64 format:', image ? image.substring(0, 30) + '...' : 'undefined');
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid image data format'
                    });
                }
                
                // Process the base64 image
                const fileUrl = saveBase64Image(image, 'medical_record');
                
                // Get image type from data URI
                const mimeType = image.split(';')[0].split(':')[1];
                
                console.log('Base64 image saved successfully:', fileUrl);
                return res.json({
                    success: true,
                    data: {
                        fileUrl: fileUrl,
                        filename: filename || `image_${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`,
                        originalName: filename || `uploaded_image.${mimeType.split('/')[1] || 'jpg'}`,
                        size: Math.round(image.length * 0.75), // Approximate size of base64 data
                        mimetype: mimeType
                    }
                });
            } catch (error) {
                console.error('Error processing base64 medical record image:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message || 'Failed to upload image'
                });
            }
        } else {
            // This is a multipart form upload request, proceed to multer middleware
            console.log('Processing as multipart form upload');
            // Log request details to help debug
            console.log('Headers:', JSON.stringify(req.headers));
            console.log('Content-Type details:', req.headers['content-type']);
            console.log('Request has files?', !!req.files);
            next();
        }
    },
    // Error handling for multer
    (err, req, res, next) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            return res.status(400).json({
                success: false,
                error: `Upload error: ${err.message}`,
                code: err.code
            });
        } else if (err) {
            console.error('Unknown upload error:', err);
            return res.status(500).json({
                success: false,
                error: `Upload error: ${err.message}`
            });
        }
        next();
    },
    uploadMedicalRecord.single('image'),
    (req, res) => {
        try {
            console.log('Multer processed the request');
            console.log('File received:', req.file ? 'Yes' : 'No');
            
            if (!req.file) {
                console.log('No file in the request:', req.body);
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            console.log('File details:', req.file);
            const fileUrl = saveUploadedFile(req.file, 'medical_record');

            console.log('File saved successfully:', fileUrl);
            res.json({
                success: true,
                data: {
                    fileUrl: fileUrl,
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    size: req.file.size,
                    mimetype: req.file.mimetype
                }
            });
        } catch (error) {
            console.error('Error uploading medical record image file:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to process uploaded file'
            });
        }
    }
);

/**
 * @route POST /api/uploads/prescription
 * @desc Upload a prescription image (either multipart form or base64)
 * @access Private (doctors only)
 */
router.post(
    '/prescription',
    authenticate,
    requireRole(['doctor']),
    (req, res, next) => {
        // Enhanced debugging
        console.log('Prescription upload request received');
        console.log('Content-Type:', req.headers['content-type']);
        console.log('Request has body?', !!req.body);
        
        // Check if request contains base64 image data
        if (req.headers['content-type']?.includes('application/json') && req.body?.image) {
            // This is a base64 upload request
            console.log('Processing as base64 image upload');
            try {
                const { image, filename } = req.body;
                
                if (!image || !image.startsWith('data:image/')) {
                    console.log('Invalid base64 format:', image ? image.substring(0, 30) + '...' : 'undefined');
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid image data format'
                    });
                }
                
                // Process the base64 image
                const fileUrl = saveBase64Image(image, 'prescription');
                
                // Get image type from data URI
                const mimeType = image.split(';')[0].split(':')[1];
                
                console.log('Base64 image saved successfully:', fileUrl);
                return res.json({
                    success: true,
                    data: {
                        fileUrl: fileUrl,
                        filename: filename || `image_${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`,
                        originalName: filename || `uploaded_image.${mimeType.split('/')[1] || 'jpg'}`,
                        size: Math.round(image.length * 0.75), // Approximate size of base64 data
                        mimetype: mimeType
                    }
                });
            } catch (error) {
                console.error('Error processing base64 prescription image:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message || 'Failed to upload image'
                });
            }
        } else {
            // This is a multipart form upload request, proceed to multer middleware
            console.log('Processing as multipart form upload');
            // Log request details to help debug
            console.log('Headers:', JSON.stringify(req.headers));
            console.log('Content-Type details:', req.headers['content-type']);
            console.log('Request has files?', !!req.files);
            next();
        }
    },
    // Error handling for multer
    (err, req, res, next) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            return res.status(400).json({
                success: false,
                error: `Upload error: ${err.message}`,
                code: err.code
            });
        } else if (err) {
            console.error('Unknown upload error:', err);
            return res.status(500).json({
                success: false,
                error: `Upload error: ${err.message}`
            });
        }
        next();
    },
    uploadPrescription.single('image'),
    (req, res) => {
        try {
            console.log('Multer processed the request');
            console.log('File received:', req.file ? 'Yes' : 'No');
            
            if (!req.file) {
                console.log('No file in the request:', req.body);
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            console.log('File details:', req.file);
            const fileUrl = saveUploadedFile(req.file, 'prescription');

            console.log('File saved successfully:', fileUrl);
            res.json({
                success: true,
                data: {
                    fileUrl: fileUrl,
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    size: req.file.size,
                    mimetype: req.file.mimetype
                }
            });
        } catch (error) {
            console.error('Error uploading prescription image file:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to process uploaded file'
            });
        }
    }
);

module.exports = router;