/**
 * This file contains utility functions and helpers for testing.
 * Import this file in your test files when you need common testing utilities.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';

// Mock the auth context for testing
export const mockAuthContext = {
  user: {
    id: 'test-doctor-id',
    name: 'Dr. Test',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'Doctor',
    specialization: 'Cardiology',
    phone: '123-456-7890',
    role: 'doctor',
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
  loading: false,
  authError: null,
  isAuthenticated: true,
};

// Helper to render components with common providers
export function renderWithProviders(ui, options = {}) {
  return render(ui, options);
}

// Mock data for testing
export const mockAppointments = [
  {
    id: 'appt1',
    patientId: 'patient1',
    patientName: 'John Doe',
    date: '2025-05-21',
    time: '10:00 AM',
    status: 'scheduled',
    reason: 'Regular checkup',
    notes: '',
    patientPhoto: null
  },
  {
    id: 'appt2',
    patientId: 'patient2',
    patientName: 'Jane Smith',
    date: '2025-05-21',
    time: '11:30 AM',
    status: 'confirmed',
    reason: 'Follow-up consultation',
    notes: 'Check blood pressure',
    patientPhoto: null
  },
  {
    id: 'appt3',
    patientId: 'patient3',
    patientName: 'Alex Johnson',
    date: '2025-05-22',
    time: '09:15 AM',
    status: 'completed',
    reason: 'Post-surgery checkup',
    notes: 'Review recovery progress',
    patientPhoto: null
  }
];

export const mockPatients = [
  {
    id: 'patient1',
    name: 'John Doe',
    gender: 'Male',
    age: 45,
    phoneNumber: '123-456-7890',
    email: 'john@example.com',
    medicalHistory: 'Hypertension',
    lastAppointment: '2025-05-01',
    nextAppointment: '2025-05-21',
    profilePhoto: null
  },
  {
    id: 'patient2',
    name: 'Jane Smith',
    gender: 'Female',
    age: 35,
    phoneNumber: '987-654-3210',
    email: 'jane@example.com',
    medicalHistory: 'Diabetes Type 2',
    lastAppointment: '2025-05-10',
    nextAppointment: '2025-05-25',
    profilePhoto: null
  },
  {
    id: 'patient3',
    name: 'Alex Johnson',
    gender: 'Male',
    age: 52,
    phoneNumber: '555-123-4567',
    email: 'alex@example.com',
    medicalHistory: 'Asthma',
    lastAppointment: '2025-05-15',
    nextAppointment: '2025-06-01',
    profilePhoto: null
  }
];

export const mockDashboardData = {
  stats: {
    appointmentCount: 120,
    patientCount: 42,
    completedAppointments: 87
  },
  todayAppointments: [
    {
      id: 'appt1',
      patient: {
        name: 'John Doe',
        user: {
          first_name: 'John',
          last_name: 'Doe'
        }
      },
      appointment_time: '10:00 AM',
      appointment_type: 'Regular Checkup',
      status: 'upcoming'
    },
    {
      id: 'appt2',
      patient: {
        name: 'Jane Smith',
        user: {
          first_name: 'Jane',
          last_name: 'Smith'
        }
      },
      appointment_time: '11:30 AM',
      appointment_type: 'Follow-up',
      status: 'upcoming'
    }
  ]
};

// Common mock implementations for services
export const mockAuthService = {
  getToken: jest.fn(() => Promise.resolve('fake-token')),
  signIn: jest.fn(() => Promise.resolve({ success: true })),
  signOut: jest.fn(() => Promise.resolve({ success: true })),
};

export const mockDoctorService = {
  getDashboard: jest.fn(() => Promise.resolve({
    success: true,
    data: mockDashboardData
  })),
  getAppointments: jest.fn(() => Promise.resolve({
    success: true,
    data: mockAppointments
  })),
  getTodayAppointments: jest.fn(() => Promise.resolve({
    success: true,
    data: mockDashboardData.todayAppointments
  })),
  getPatients: jest.fn(() => Promise.resolve({
    success: true,
    data: mockPatients
  })),
};

// Custom mock for async storage
export const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
