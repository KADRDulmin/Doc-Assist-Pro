import { User } from './user.model';

/**
 * Login credentials model
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration credentials model
 */
export interface RegisterCredentials {
  email: string;
  password: string;
}

/**
 * Authentication response model
 */
export interface AuthResponse {
  success: boolean;
  token: string;
  user?: User;
  message?: string;
}

/**
 * Registration response model
 */
export interface RegisterResponse {
  success: boolean;
  message: string;
}
