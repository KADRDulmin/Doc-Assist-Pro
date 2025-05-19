import { BASE_URL } from '../services/api';

/**
 * Converts a relative image path to a full URL
 * @param url - Image URL (can be relative path or full URL)
 * @returns Full URL to the image
 */
export const getFullImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  
  // If it's already a full URL, return it as is
  if (url.startsWith('http')) {
    return url;
  }
  
  // Ensure the URL starts with a slash if needed
  const formattedPath = url.startsWith('/') ? url : `/${url}`;
  
  // Construct the full URL using the API base URL
  return `${BASE_URL}${formattedPath}`;
};