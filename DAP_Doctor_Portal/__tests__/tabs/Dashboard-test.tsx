import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

// Common mocks are in jest.setup.js and __tests__/mocks.js
jest.mock('../../components/ui/ModernHeader', () => 'ModernHeader');
jest.mock('../../components/ThemedView', () => ({
  ThemedView: 'ThemedView',
}));
jest.mock('../../components/ThemedText', () => ({
  ThemedText: 'ThemedText',
}));

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-doctor-id', name: 'Dr. Test' },
  }),
}));

// Mock the services
jest.mock('../../services/authService', () => ({
  getToken: jest.fn(() => Promise.resolve('fake-token')),
}));

jest.mock('../../services/doctorService', () => ({
  getDashboard: jest.fn(() => Promise.resolve({
    success: true,
    data: {
      totalPatients: 42,
      totalAppointments: 120,
      appointmentsToday: 5,
      upcomingAppointments: 8,
      recentConsultations: []
    }
  })),
  getTodayAppointments: jest.fn(() => Promise.resolve({
    success: true,
    data: [
      { 
        id: 'appt1',
        patientName: 'John Doe',
        time: '10:00 AM',
        status: 'scheduled'
      },
      {
        id: 'appt2',
        patientName: 'Jane Smith',
        time: '11:30 AM',
        status: 'scheduled'
      }
    ]
  })),
}));

import DashboardScreen from '../../app/(tabs)/index';

describe('<DashboardScreen />', () => {  test('renders dashboard screen with loading state initially', () => {
    const { getByText } = render(<DashboardScreen />);
    
    // Check if loading text is present
    expect(getByText('Loading your dashboard...')).toBeTruthy();
  });

  test('loads and displays dashboard data', async () => {
    const { getByText } = render(<DashboardScreen />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(getByText('42')).toBeTruthy(); // Total patients
      expect(getByText('120')).toBeTruthy(); // Total appointments
      expect(getByText('5')).toBeTruthy(); // Today's appointments
      expect(getByText('8')).toBeTruthy(); // Upcoming appointments
    });
  });

  test('displays today\'s appointments', async () => {
    const { getByText } = render(<DashboardScreen />);
    
    // Wait for appointments to load
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Jane Smith')).toBeTruthy();
      expect(getByText('10:00 AM')).toBeTruthy();
      expect(getByText('11:30 AM')).toBeTruthy();
    });
  });

  test('handles error state', async () => {
    // Mock the service to return an error
    jest.spyOn(require('../../services/authService'), 'getToken').mockImplementationOnce(() => 
      Promise.resolve(null)
    );
    
    const { getByText } = render(<DashboardScreen />);
    
    // Wait for error to display
    await waitFor(() => {
      expect(getByText('Authentication token not found')).toBeTruthy();
    });
  });
});
