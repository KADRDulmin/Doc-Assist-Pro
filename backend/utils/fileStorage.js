/**
 * File Storage Utility
 * Handles file storage operations for images and other files
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);

// Define root upload directories
const UPLOAD_DIR = path.resolve(__dirname, '../uploads');
const MEDICAL_RECORDS_DIR = path.resolve(UPLOAD_DIR, 'medical_records');
const PRESCRIPTIONS_DIR = path.resolve(UPLOAD_DIR, 'prescriptions');

// Create directories if they don't exist - with enhanced error handling
function ensureDirectoriesExist() {
    const dirs = [UPLOAD_DIR, MEDICAL_RECORDS_DIR, PRESCRIPTIONS_DIR];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            try {
                console.log(`Creating directory: ${dir}`);
                fs.mkdirSync(dir, { recursive: true, mode: 0o755 }); // Setting explicit permissions
                console.log(`Successfully created directory: ${dir}`);
                
                // Verify directory was created
                if (!fs.existsSync(dir)) {
                    console.error(`Failed to create directory: ${dir} - Does not exist after creation`);
                } else {
                    // Check if directory is writable
                    try {
                        const testFile = path.join(dir, '.test-write-access');
                        fs.writeFileSync(testFile, 'test');
                        fs.unlinkSync(testFile);
                        console.log(`Directory ${dir} is writable`);
                    } catch (writeError) {
                        console.error(`Directory ${dir} is not writable:`, writeError.message);
                    }
                }
            } catch (err) {
                console.error(`Error creating directory ${dir}:`, err);
                console.error(`Current working directory: ${process.cwd()}`);
                console.error(`Node process user: ${process.env.USER || 'unknown'}`);
            }
        } else {
            console.log(`Directory already exists: ${dir}`);
            // Check if directory is writable
            try {
                const testFile = path.join(dir, '.test-write-access');
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
                console.log(`Directory ${dir} is writable`);
            } catch (writeError) {
                console.error(`Directory ${dir} exists but is not writable:`, writeError.message);
            }
        }
    });
}

// Create directories on module load
ensureDirectoriesExist();

/**
 * Configure multer storage for file uploads
 * @param {string} fileType - Type of file ('medical_record' or 'prescription')
 */
function getMulterStorage(fileType) {
    return multer.diskStorage({
        destination: function(req, file, cb) {
            console.log(`Processing ${fileType} upload. File:`, file.originalname);
            
            if (fileType === 'medical_record') {
                cb(null, MEDICAL_RECORDS_DIR);
            } else if (fileType === 'prescription') {
                cb(null, PRESCRIPTIONS_DIR);
            } else {
                cb(new Error(`Invalid file type: ${fileType}`), null);
            }
        },
        filename: function(req, file, cb) {
            const timestamp = Date.now();
            const randomString = crypto.randomBytes(8).toString('hex');
            const fileExt = path.extname(file.originalname) || '.jpg'; // Default to .jpg if no extension
            const newFilename = `${timestamp}-${randomString}${fileExt}`;
            console.log(`Generated filename: ${newFilename} for ${file.originalname}`);
            cb(null, newFilename);
        }
    });
}

/**
 * Create a multer upload instance for handling file uploads
 * @param {string} fileType - Type of file ('medical_record' or 'prescription')
 */
function createUploader(fileType) {
    console.log(`Creating uploader for fileType: ${fileType}`);
    
    return multer({
        storage: getMulterStorage(fileType),
        limits: {
            fileSize: 10 * 1024 * 1024, // Increased to 10MB limit
        },
        fileFilter: function(req, file, cb) {
            console.log(`Filtering file: ${file.originalname}, mimetype: ${file.mimetype}`);
            
            // Accept only image files, with more flexible MIME type checking
            if (!file.mimetype.includes('image/')) {
                console.log(`Rejected file: ${file.originalname}, invalid MIME type: ${file.mimetype}`);
                return cb(new Error('Only image files are allowed!'), false);
            }
            console.log(`Accepted file: ${file.originalname}`);
            cb(null, true);
        }
    });
}

/**
 * Process uploaded file and return the URL path
 * @param {Express.Multer.File} file - Uploaded file object from multer
 * @param {string} fileType - Type of file ('medical_record' or 'prescription')
 * @returns {string} The URL to the saved file (relative to the backend server)
 */
function saveUploadedFile(file, fileType) {
    try {
        console.log(`Saving uploaded ${fileType} file:`, file);
        
        // Validate file type
        if (!['medical_record', 'prescription'].includes(fileType)) {
            throw new Error(`Invalid file type: ${fileType}`);
        }

        if (!file) {
            throw new Error('No file was uploaded');
        }

        // Determine the relative URL path
        let relativePath;
        if (fileType === 'medical_record') {
            relativePath = `/uploads/medical_records/${file.filename}`;
        } else { // prescription
            relativePath = `/uploads/prescriptions/${file.filename}`;
        }

        console.log(`Saved ${fileType} image: ${file.path}`);
        console.log(`File URL: ${relativePath}`);

        // Return relative URL path to the file
        return relativePath;
    } catch (error) {
        console.error(`Error saving uploaded ${fileType} file:`, error);
        throw new Error(`Failed to save ${fileType} file: ${error.message}`);
    }
}

/**
 * Save a base64 encoded image to file system
 * @param {string} base64Image - Base64 encoded image data (including data URI scheme)
 * @param {string} fileType - Type of file ('medical_record' or 'prescription')
 * @returns {string} The URL to the saved file (relative to the backend server)
 */
function saveBase64Image(base64Image, fileType) {
    try {
        // Validate file type
        if (!['medical_record', 'prescription'].includes(fileType)) {
            throw new Error(`Invalid file type: ${fileType}`);
        }

        // Validate base64 format
        if (!base64Image || !base64Image.startsWith('data:image/')) {
            throw new Error('Invalid base64 image format');
        }

        // Parse base64 string to get MIME type and data
        const matches = base64Image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 image format');
        }

        // Extract MIME type and actual base64 data
        const imageType = matches[1];
        const imageData = matches[2];
        const buffer = Buffer.from(imageData, 'base64');

        // Create a unique filename
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const filename = `${timestamp}-${randomString}.${imageType}`;

        // Determine target directory
        let targetDir;
        let relativePath;

        if (fileType === 'medical_record') {
            targetDir = MEDICAL_RECORDS_DIR;
            relativePath = `/uploads/medical_records/${filename}`;
        } else { // prescription
            targetDir = PRESCRIPTIONS_DIR;
            relativePath = `/uploads/prescriptions/${filename}`;
        }

        // Save the file
        const filePath = path.join(targetDir, filename);
        fs.writeFileSync(filePath, buffer);

        console.log(`Saved ${fileType} image: ${filePath}`);

        // Return relative URL path to the file
        return relativePath;
    } catch (error) {
        console.error(`Error saving ${fileType} image:`, error);
        throw new Error(`Failed to save ${fileType} image: ${error.message}`);
    }
}

/**
 * Delete an image file from storage
 * @param {string} fileUrl - URL or path to the file to delete
 * @returns {boolean} True if deleted successfully or file doesn't exist
 */
function deleteImage(fileUrl) {
    try {
        // If the fileUrl doesn't start with '/uploads', it may be a full URL or external link
        if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
            console.log(`Not deleting file with non-local URL: ${fileUrl}`);
            return false; // Don't attempt to delete non-local files
        }

        // Convert relative URL to filesystem path
        const relativePath = fileUrl.replace('/uploads/', ''); // Remove leading '/uploads/'
        const filePath = path.join(UPLOAD_DIR, relativePath);

        // Check if file exists
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${filePath}`);
            return true;
        } else {
            console.log(`File not found: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        // Don't throw error here to prevent failures in database operations
        return false;
    }
}

/**
 * Future method to migrate files to S3
 * @param {string} localFilePath - Path to local file
 * @param {string} fileType - Type of file
 * @returns {Promise<string>} S3 URL of the uploaded file
 */
async function migrateToS3(localFilePath, fileType) {
    // This is a placeholder for future S3 implementation
    console.log(`[FUTURE] Would migrate ${localFilePath} to S3 as ${fileType}`);
    
    // When implementing, you would:
    // 1. Use AWS SDK to upload the file to S3
    // 2. Make sure the bucket has proper CORS settings
    // 3. Return the S3 URL to the uploaded file
    // 4. Optionally delete the local file after upload

    // For now, just return the local file path
    return localFilePath;
}

module.exports = {
    saveBase64Image,
    saveUploadedFile,
    deleteImage,
    migrateToS3,
    createUploader
};