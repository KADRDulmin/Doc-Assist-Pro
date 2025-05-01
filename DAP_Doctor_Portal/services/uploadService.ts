import api, { ApiResponse, BASE_URL } from './api';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface UploadedFileResponse {
  fileUrl: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
}

/**
 * Upload service for handling image uploads in the Doctor Portal
 */
const uploadService = {
  /**
   * Upload a medical record image to the server
   * 
   * @param imageUri - Local URI of the image file or base64 data URI
   * @param token - Authentication token
   * @returns Promise with the API response containing the file URL
   */
  uploadMedicalRecordImage: async (
    imageUri: string,
    token: string
  ): Promise<ApiResponse<UploadedFileResponse>> => {
    try {
      console.log('Uploading medical record image:', imageUri.substring(0, 50) + '...');
      
      // Use the more reliable base64 approach since it's working correctly
      // Check if it's already a base64 string
      if (imageUri.startsWith('data:image/')) {
        return await uploadBase64Image(imageUri, 'medical-record', token);
      } 
      // If it's a file URI, convert it to base64 first
      else {
        try {
          // Attempt to read the file as base64
          const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64
          });
          
          // Determine MIME type based on file extension
          let mimeType = 'image/jpeg';
          if (imageUri.toLowerCase().endsWith('.png')) {
            mimeType = 'image/png';
          } else if (imageUri.toLowerCase().endsWith('.gif')) {
            mimeType = 'image/gif';
          }
          
          // Create proper data URI format
          const dataUri = `data:${mimeType};base64,${base64}`;
          
          // Upload as base64
          return await uploadBase64Image(dataUri, 'medical-record', token);
        } catch (readError) {
          console.error('Error reading file as base64:', readError);
          
          // Fall back to FormData approach with improved implementation
          return await uploadWithFormData(imageUri, 'medical-record', token);
        }
      }
    } catch (error: unknown) {
      console.error('Error uploading medical record image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      return {
        success: false,
        error: errorMessage,
        status: 500
      };
    }
  },
  
  /**
   * Upload a prescription image to the server
   * 
   * @param imageUri - Local URI of the image file or base64 data URI
   * @param token - Authentication token
   * @returns Promise with the API response containing the file URL
   */
  uploadPrescriptionImage: async (
    imageUri: string,
    token: string
  ): Promise<ApiResponse<UploadedFileResponse>> => {
    try {
      console.log('Uploading prescription image:', imageUri.substring(0, 50) + '...');
      
      // Use the more reliable base64 approach since it's working correctly
      // Check if it's already a base64 string
      if (imageUri.startsWith('data:image/')) {
        return await uploadBase64Image(imageUri, 'prescription', token);
      } 
      // If it's a file URI, convert it to base64 first
      else {
        try {
          // Attempt to read the file as base64
          const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64
          });
          
          // Determine MIME type based on file extension
          let mimeType = 'image/jpeg';
          if (imageUri.toLowerCase().endsWith('.png')) {
            mimeType = 'image/png';
          } else if (imageUri.toLowerCase().endsWith('.gif')) {
            mimeType = 'image/gif';
          }
          
          // Create proper data URI format
          const dataUri = `data:${mimeType};base64,${base64}`;
          
          // Upload as base64
          return await uploadBase64Image(dataUri, 'prescription', token);
        } catch (readError) {
          console.error('Error reading file as base64:', readError);
          
          // Fall back to FormData approach with improved implementation
          return await uploadWithFormData(imageUri, 'prescription', token);
        }
      }
    } catch (error: unknown) {
      console.error('Error uploading prescription image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      return {
        success: false,
        error: errorMessage,
        status: 500
      };
    }
  }
};

/**
 * Helper function to upload an image using base64 encoding
 * 
 * @param base64Image - Base64 encoded image data (including data URI scheme)
 * @param imageType - Type of image ('medical-record' or 'prescription')
 * @param token - Authentication token
 * @returns Promise with the API response containing the file URL
 */
async function uploadBase64Image(
  base64Image: string,
  imageType: 'medical-record' | 'prescription',
  token: string
): Promise<ApiResponse<UploadedFileResponse>> {
  // Create a unique filename
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 10);
  const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/jpeg';
  const extension = mimeType.split('/')[1] || 'jpg';
  const fileName = `image_${timestamp}_${randomString}.${extension}`;
  
  console.log(`Uploading ${imageType} as base64, MIME type: ${mimeType}`);
  
  // Send the base64 data directly as JSON
  const response = await fetch(`${BASE_URL}/api/uploads/${imageType}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      image: base64Image,
      filename: fileName
    })
  });
  
  console.log(`${imageType} base64 upload response status:`, response.status);
  const responseData = await response.json();
  
  if (!response.ok) {
    console.error(`Base64 upload failed with status ${response.status}:`, responseData.error);
    return {
      success: false,
      error: responseData.error || 'Failed to upload image',
      status: response.status
    };
  }
  
  return {
    success: true,
    data: responseData.data,
    status: response.status
  };
}

/**
 * Helper function to upload an image using FormData
 * This is a fallback method if base64 conversion fails
 * 
 * @param imageUri - Local URI of the image file
 * @param imageType - Type of image ('medical-record' or 'prescription')
 * @param token - Authentication token
 * @returns Promise with the API response containing the file URL
 */
async function uploadWithFormData(
  imageUri: string,
  imageType: 'medical-record' | 'prescription',
  token: string
): Promise<ApiResponse<UploadedFileResponse>> {
  // Create FormData for file upload
  const formData = new FormData();
  
  // Get file information
  const uriParts = imageUri.split('/');
  const fileName = uriParts[uriParts.length - 1] || `image_${Date.now()}.jpg`;
  
  // Determine MIME type based on file extension
  let mimeType = 'image/jpeg';
  if (fileName.toLowerCase().endsWith('.png')) {
    mimeType = 'image/png';
  } else if (fileName.toLowerCase().endsWith('.gif')) {
    mimeType = 'image/gif';
  }
  
  console.log(`Uploading ${imageType} with FormData`, {
    uri: imageUri,
    name: fileName,
    type: mimeType
  });
  
  // Create file object for FormData with proper type definitions
  const fileObj = {
    uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
    name: fileName,
    type: mimeType
  };
  
  // Explicitly cast as any to avoid TypeScript issues with FormData
  formData.append('image', fileObj as any);
  
  console.log(`FormData created for ${imageType} upload with file: ${fileName}`);
  
  // Upload the file
  const response = await fetch(`${BASE_URL}/api/uploads/${imageType}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Important: Don't set Content-Type, let the browser set it with boundary
    },
    body: formData
  });
  
  console.log(`${imageType} FormData upload response status:`, response.status);
  const responseData = await response.json();
  
  if (!response.ok) {
    console.error(`FormData upload failed with status ${response.status}:`, responseData.error);
    return {
      success: false,
      error: responseData.error || 'Failed to upload image',
      status: response.status
    };
  }
  
  return {
    success: true,
    data: responseData.data,
    status: response.status
  };
}

export default uploadService;