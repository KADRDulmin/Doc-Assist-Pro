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

jest.mock('../../services/doctorService', () => ({
  getPatients: jest.fn(() => Promise.resolve({
    success: true,
    data: mockPatients
  })),
}));

import PatientsScreen from '../../app/(tabs)/patients';

describe('<PatientsScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders patients screen with loading state initially', () => {
    const { getByTestId } = render(<PatientsScreen />);
    
    // Assuming there's a loading indicator with testID
    expect(() => getByTestId('loading-indicator')).not.toThrow();
  });

  test('loads and displays patients', async () => {
    const { getByText } = render(<PatientsScreen />);
    
    // Wait for patients to load
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Jane Smith')).toBeTruthy();
      expect(getByText('Alex Johnson')).toBeTruthy();
    });
  });

  test('can filter patients by search query', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<PatientsScreen />);
    
    // Wait for patients to load first
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });
    
    // Find search input and type into it
    const searchInput = getByPlaceholderText('Search patients...');
    fireEvent.changeText(searchInput, 'Jane');
    
    // Check that only Jane Smith is shown
    await waitFor(() => {
      expect(getByText('Jane Smith')).toBeTruthy();
      expect(queryByText('John Doe')).toBeNull();
      expect(queryByText('Alex Johnson')).toBeNull();
    });
  });

  test('can navigate to patient details', async () => {
    const { getByText } = render(<PatientsScreen />);
    const router = require('expo-router').useRouter();
    
    // Wait for patients to load first
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });
    
    // Click on a patient
    fireEvent.press(getByText('John Doe'));
    
    // Check that router.push was called with the correct path
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/patient/patient1',
      params: { patientId: 'patient1' }
    });
  });

  test('displays patient information correctly', async () => {
    const { getByText } = render(<PatientsScreen />);
    
    // Wait for patients to load
    await waitFor(() => {
      // Check if basic patient info is displayed
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Male, 45')).toBeTruthy();
      expect(getByText('Hypertension')).toBeTruthy();
      
      expect(getByText('Jane Smith')).toBeTruthy();
      expect(getByText('Female, 35')).toBeTruthy();
      expect(getByText('Diabetes Type 2')).toBeTruthy();
    });
  });

  test('handles error state', async () => {
    // Mock the service to return an error
    jest.spyOn(require('../../services/doctorService'), 'getPatients').mockImplementationOnce(() => 
      Promise.resolve({
        success: false,
        error: 'Failed to load patients'
      })
    );
    
    const { getByText } = render(<PatientsScreen />);
    
    // Wait for error to display
    await waitFor(() => {
      expect(getByText('Failed to load patients')).toBeTruthy();
    });
  });
});
