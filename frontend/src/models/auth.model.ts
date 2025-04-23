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
  first_name?: string;
  last_name?: string;
  phone?: string;
}

/**
 * Patient profile data model
 */
export interface PatientProfileData {
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  allergies?: string;
  medical_history?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

/**
 * Combined patient registration data
 */
export interface PatientRegisterData extends RegisterCredentials, PatientProfileData {
  // Combined user and patient profile data
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
  data?: any;
}
