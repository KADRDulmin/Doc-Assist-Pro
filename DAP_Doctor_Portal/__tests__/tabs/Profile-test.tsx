import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{ uri: 'file://mock-image.jpg' }]
  })),
  MediaTypeOptions: {
    Images: 'Images'
  },
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
    user: { 
      id: 'test-doctor-id', 
      name: 'Dr. Test',
      email: 'test@example.com',
      phone: '123-456-7890',
      specialization: 'Cardiology',
      experience: '10 years'
    },
    signOut: jest.fn(),
  }),
}));

// Mock the doctor service
jest.mock('../../services/doctorService', () => ({
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
}));

import ProfileScreen from '../../app/(tabs)/profile';

describe('<ProfileScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up AsyncStorage mock implementations
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'notifications-enabled') return Promise.resolve('true');
      if (key === 'profile-image') return Promise.resolve(null);
      return Promise.resolve(null);
    });
  });

  test('renders profile screen with user data', async () => {
    const { getByText } = render(<ProfileScreen />);
    
    await waitFor(() => {
      expect(getByText('Dr. Test')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
      expect(getByText('123-456-7890')).toBeTruthy();
      expect(getByText('Cardiology')).toBeTruthy();
    });
  });

  test('can toggle notification settings', async () => {
    const { getByTestId } = render(<ProfileScreen />);
    
    // Find notification switch by testID
    const notificationSwitch = getByTestId('notification-switch');
    
    // Toggle the switch
    fireEvent(notificationSwitch, 'valueChange', false);
    
    // Verify AsyncStorage was called with the new value
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('notifications-enabled', 'false');
    });
  });

  test('shows logout confirmation dialog', async () => {
    const { getByText, queryByText } = render(<ProfileScreen />);
    
    // Initially the dialog should not be visible
    expect(queryByText('Confirm Logout')).toBeNull();
    
    // Click the logout button
    fireEvent.press(getByText('Logout'));
    
    // Now the dialog should be visible
    await waitFor(() => {
      expect(getByText('Confirm Logout')).toBeTruthy();
      expect(getByText('Are you sure you want to logout?')).toBeTruthy();
    });
  });

  test('can confirm logout', async () => {
    const { getByText } = render(<ProfileScreen />);
    const { signOut } = require('../../contexts/AuthContext').useAuth();
    
    // Open logout dialog
    fireEvent.press(getByText('Logout'));
    
    // Confirm logout
    fireEvent.press(getByText('Yes, Logout'));
    
    // Verify signOut was called
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });

  test('can navigate to edit profile', async () => {
    const { getByText } = render(<ProfileScreen />);
    const router = require('expo-router').useRouter();
    
    // Click the edit profile button
    fireEvent.press(getByText('Edit Profile'));
    
    // Verify navigation
    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/edit-profile');
    });
  });
});
