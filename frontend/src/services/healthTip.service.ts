import api from '../config/api';

export interface HealthTipData {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class HealthTipService {
  /**
   * Get all health tips
   */
  async getAllTips(limit?: number, page?: number): Promise<ApiResponse<HealthTipData[]>> {
    const params = { limit, page };
    const response = await api.get('/api/health-tips', { params });
    return response as ApiResponse<HealthTipData[]>;
  }

  /**
   * Get a random health tip
   */
  async getRandomTip(): Promise<ApiResponse<HealthTipData>> {
    const response = await api.get('/api/health-tips/random');
    return response as ApiResponse<HealthTipData>;
  }

  /**
   * Get multiple random health tips
   */
  async getRandomTips(count: number = 3): Promise<ApiResponse<HealthTipData[]>> {
    const response = await api.get('/api/health-tips/random-multiple', { params: { count } });
    return response as ApiResponse<HealthTipData[]>;
  }

  /**
   * Get available health tip categories
   */
  async getCategories(): Promise<ApiResponse<string[]>> {
    const response = await api.get('/api/health-tips/categories');
    return response as ApiResponse<string[]>;
  }

  /**
   * Get health tips by category
   */
  async getByCategory(category: string, limit?: number, page?: number): Promise<ApiResponse<HealthTipData[]>> {
    const params = { category, limit, page };
    const response = await api.get('/api/health-tips', { params });
    return response as ApiResponse<HealthTipData[]>;
  }

  /**
   * Get a specific health tip by ID
   */
  async getTipById(tipId: number): Promise<ApiResponse<HealthTipData>> {
    const response = await api.get(`/api/health-tips/${tipId}`);
    return response as ApiResponse<HealthTipData>;
  }
}

export default new HealthTipService();