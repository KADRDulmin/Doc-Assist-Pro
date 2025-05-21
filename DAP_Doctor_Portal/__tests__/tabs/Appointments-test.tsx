import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock the dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

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
    user: { id: 'test-doctor-id' },
  }),
}));

// Mock the services
jest.mock('../../services/authService', () => ({
  getToken: jest.fn(() => Promise.resolve('fake-token')),
}));

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

jest.mock('../../services/doctorService', () => ({
  getAppointments: jest.fn(() => Promise.resolve({
    success: true,
    data: mockAppointments
  })),
  updateAppointmentStatus: jest.fn(() => Promise.resolve({
    success: true
  })),
}));

import AppointmentsScreen from '../../app/(tabs)/appointments';

describe('<AppointmentsScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders appointments screen with loading state initially', () => {
    const { getByTestId } = render(<AppointmentsScreen />);
    
    // Assuming there's a loading indicator with testID
    expect(() => getByTestId('loading-indicator')).not.toThrow();
  });

  test('loads and displays appointments', async () => {
    const { getByText } = render(<AppointmentsScreen />);
    
    // Wait for appointments to load
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Jane Smith')).toBeTruthy();
      expect(getByText('Alex Johnson')).toBeTruthy();
    });
  });

  test('can filter appointments by search query', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<AppointmentsScreen />);
    
    // Wait for appointments to load first
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });
    
    // Find search input and type into it
    const searchInput = getByPlaceholderText('Search appointments...');
    fireEvent.changeText(searchInput, 'Jane');
    
    // Check that only Jane Smith is shown
    await waitFor(() => {
      expect(getByText('Jane Smith')).toBeTruthy();
      expect(queryByText('John Doe')).toBeNull();
      expect(queryByText('Alex Johnson')).toBeNull();
    });
  });

  test('can filter appointments by status', async () => {
    const { getByText, queryByText } = render(<AppointmentsScreen />);
    
    // Wait for appointments to load first
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });
    
    // Click the "Completed" filter button
    fireEvent.press(getByText('Completed'));
    
    // Check that only completed appointments are shown
    await waitFor(() => {
      expect(getByText('Alex Johnson')).toBeTruthy();
      expect(queryByText('John Doe')).toBeNull();
      expect(queryByText('Jane Smith')).toBeNull();
    });
  });

  test('can navigate to appointment details', async () => {
    const { getByText } = render(<AppointmentsScreen />);
    const router = require('expo-router').useRouter();
    
    // Wait for appointments to load first
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });
    
    // Click on an appointment
    fireEvent.press(getByText('John Doe'));
    
    // Check that router.push was called with the correct path
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/consultation/appt1',
      params: { appointmentId: 'appt1' }
    });
  });

  test('handles error state', async () => {
    // Mock the service to return an error
    jest.spyOn(require('../../services/doctorService'), 'getAppointments').mockImplementationOnce(() => 
      Promise.resolve({
        success: false,
        error: 'Failed to load appointments'
      })
    );
    
    const { getByText } = render(<AppointmentsScreen />);
    
    // Wait for error to display
    await waitFor(() => {
      expect(getByText('Failed to load appointments')).toBeTruthy();
    });
  });
});
