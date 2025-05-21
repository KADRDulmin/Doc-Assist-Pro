// Global mock configuration for tests
import { jest } from '@jest/globals';
import React from 'react';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const mockAsyncStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(),
    flushGetRequests: jest.fn(),
    multiGet: jest.fn(),
    multiSet: jest.fn(),
    multiRemove: jest.fn(),
    multiMerge: jest.fn(),
    mergeItem: jest.fn()
  };
  return mockAsyncStorage;
});

// Mock Expo Router
jest.mock('expo-router', () => {
  const mockExpoRouter = {
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn()
    }),
    useNavigation: () => ({
      canGoBack: jest.fn(() => true),
      goBack: jest.fn()
    }),
    Tabs: ({ children }) => children,
    useLocalSearchParams: () => ({})
  };
  return mockExpoRouter;
});

// Mock Expo modules
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient'
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar'
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{ uri: 'file://mock-image.jpg' }]
  })),
  MediaTypeOptions: {
    Images: 'Images'
  }
}));

// Mock React Native modules
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children
}));

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock UI components
jest.mock('../components/ui/ModernHeader', () => 'ModernHeader');
jest.mock('../components/ThemedView', () => ({
  ThemedView: 'ThemedView'
}));
jest.mock('../components/ThemedText', () => ({
  ThemedText: 'ThemedText'
}));

// Mock Auth Context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { 
      id: 'test-doctor-id', 
      name: 'Dr. Test',
      first_name: 'Test',
      last_name: 'Doctor',
      email: 'test@example.com'
    },
    signOut: jest.fn(),
    isAuthenticated: true
  })
}));

// Mock Notification Context
jest.mock('../contexts/notificationContext', () => ({
  useNotifications: () => ({ 
    unreadCount: 5,
    notifications: [],
    markAsRead: jest.fn(),
    clearAll: jest.fn() 
  })
}));

// Mock services
jest.mock('../services/authService', () => ({
  getToken: jest.fn(() => Promise.resolve('fake-token')),
  signIn: jest.fn(() => Promise.resolve({ success: true })),
  signOut: jest.fn(() => Promise.resolve({ success: true }))
}));

// Mock doctor service with test data
jest.mock('../services/doctorService', () => {
  const mockAppointments = [
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

  const mockPatients = [
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
    }
  ];

  const mockDashboardData = {
    stats: {
      appointmentCount: 120,
      patientCount: 42,
      completedAppointments: 87
    },
    totalPatients: 42,
    totalAppointments: 120,
    appointmentsToday: 5,
    upcomingAppointments: 8,
    recentConsultations: [],
    todayAppointments: mockAppointments.slice(0, 2)
  };

  return {
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
      data: mockAppointments.slice(0, 2)
    })),
    getPatients: jest.fn(() => Promise.resolve({
      success: true,
      data: mockPatients
    })),
    getDoctorProfile: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        id: 'test-doctor-id',
        name: 'Dr. Test',
        email: 'test@example.com',
        phone: '123-456-7890',
        specialization: 'Cardiology',
        experience: '10 years'
      }
    })),
    updateProfile: jest.fn(() => Promise.resolve({ success: true })),
    updateAppointmentStatus: jest.fn(() => Promise.resolve({
      success: true
    }))
  };
});
