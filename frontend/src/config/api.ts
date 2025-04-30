import BaseApiService, { HttpMethod } from '../services/api/base-api.service';

/**
 * API client for making HTTP requests
 * A wrapper around BaseApiService that provides a more convenient interface
 */
class ApiClient extends BaseApiService {
  /**
   * Perform a GET request
   * @param endpoint - API endpoint
   * @param params - URL parameters
   * @param requiresAuth - Whether the request requires authentication
   */
  async get<T = any>(endpoint: string, { params = {} } = {}, requiresAuth = true): Promise<T> {
    // Convert params to query string if provided
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    // Make sure to pass the requiresAuth parameter
    return this.request<T>(url, HttpMethod.GET, undefined, requiresAuth);
  }

  /**
   * Perform a POST request
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @param requiresAuth - Whether the request requires authentication
   */
  async post<T = any>(endpoint: string, data: any, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, HttpMethod.POST, data, requiresAuth);
  }

  /**
   * Perform a PUT request
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @param requiresAuth - Whether the request requires authentication
   */
  async put<T = any>(endpoint: string, data: any = {}, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, HttpMethod.PUT, data, requiresAuth);
  }

  /**
   * Perform a DELETE request
   * @param endpoint - API endpoint
   * @param requiresAuth - Whether the request requires authentication
   */
  async delete<T = any>(endpoint: string, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, HttpMethod.DELETE, undefined, requiresAuth);
  }

  /**
   * Perform a PATCH request
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @param requiresAuth - Whether the request requires authentication
   */
  async patch<T = any>(endpoint: string, data: any = {}, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, HttpMethod.PATCH, data, requiresAuth);
  }
}

// Create and export a singleton instance
const api = new ApiClient();
export default api;
