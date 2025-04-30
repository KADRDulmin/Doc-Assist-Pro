/**
 * API Response Type
 * Standard response format from the API
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}