import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/Config';

// Configure axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically if available
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Register a new doctor
export const registerDoctor = async (doctorData) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone,
      specialization,
      licenseNumber,
      yearsOfExperience,
      education,
      bio,
      consultationFee
    } = doctorData;
    
    // Format the data according to the API expectations
    const requestData = {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      phone,
      specialization,
      license_number: licenseNumber,
      years_of_experience: yearsOfExperience ? parseInt(yearsOfExperience) : undefined,
      education,
      bio,
      consultation_fee: consultationFee ? parseFloat(consultationFee) : undefined
    };
    
    const response = await apiClient.post('/auth/register/doctor', requestData);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Registration failed');
    }
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      throw new Error(error.response.data.error || 'Registration failed');
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('Network error. Please check your internet connection.');
    } else {
      // Something else happened in setting up the request
      throw error;
    }
  }
};

// Get doctor profile
export const getDoctorProfile = async () => {
  try {
    const response = await apiClient.get('/doctors/profile/me');
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch profile');
    }
    
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch profile');
    } else if (error.request) {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw error;
    }
  }
};

// Update doctor profile
export const updateDoctorProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/doctors/profile/me', profileData);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update profile');
    }
    
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to update profile');
    } else if (error.request) {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw error;
    }
  }
};

// Get doctor appointments
export const getDoctorAppointments = async (status = null) => {
  try {
    const endpoint = status ? 
      `/doctors/appointments?status=${status}` : 
      '/doctors/appointments';
      
    const response = await apiClient.get(endpoint);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch appointments');
    }
    
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch appointments');
    } else if (error.request) {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw error;
    }
  }
};
