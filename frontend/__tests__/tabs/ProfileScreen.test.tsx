import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../../app/(tabs)/profile';
import { useAuth } from '@/src/hooks/useAuth';
import patientService from '@/src/services/patient.service';
import { mockPatientProfile } from '../../__mocks__/patientServiceMock';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// Mock the hooks and services
jest.mock('@/src/hooks/useAuth');
jest.mock('@/src/services/patient.service');
jest.mock('@/hooks/useColorScheme', () => () => 'light');
jest.mock('expo-location');

describe('ProfileScreen', () => {
  beforeEach(() => {
    // Setup mocks before each test
    useAuth.mockReturnValue({
      user: {
        id: 1,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane.doe@example.com',
      },
      logout: jest.fn(),
      isAuthenticated: true,
    });

    // Mock the patient service
    patientService.getMyProfile.mockResolvedValue({
      success: true,
      data: mockPatientProfile
    });

    // Mock Location permissions
    Location.requestForegroundPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync = jest.fn().mockResolvedValue({
      coords: { latitude: 6.9271, longitude: 79.8612 }
    });

    // Clear all router and AsyncStorage mock calls
    jest.clearAllMocks();
  });

  it('renders correctly with loading state', () => {
    const { getByTestId } = render(<ProfileScreen />);
    expect(getByTestId('profile-loading')).toBeDefined();
  });

  it('loads profile data on mount and displays user information', async () => {
    const { getByText, queryByTestId } = render(<ProfileScreen />);
    
    // Should start with loading state
    expect(queryByTestId('profile-loading')).toBeDefined();
    
    // Wait for the data to load
    await waitFor(() => {
      expect(queryByTestId('profile-loading')).toBeNull();
      expect(getByText('Jane Doe')).toBeDefined();
      expect(getByText('jane.doe@example.com')).toBeDefined();
      expect(getByText('555-123-4567')).toBeDefined();
    });
    
    // Check if the service was called
    expect(patientService.getMyProfile).toHaveBeenCalled();
  });

  it('shows medical information from the profile', async () => {
    const { getByText, queryByTestId } = render(<ProfileScreen />);
    
    await waitFor(() => {
      expect(queryByTestId('profile-loading')).toBeNull();
      expect(getByText('O+')).toBeDefined(); // Blood group
      expect(getByText('Penicillin')).toBeDefined(); // Allergies
      expect(getByText('Previous appendectomy in 2018')).toBeDefined(); // Medical history
    });
  });

  it('handles toggling notifications', async () => {
    const { getByTestId } = render(<ProfileScreen />);
    
    await waitFor(() => expect(getByTestId('notifications-switch')).toBeDefined());

    const toggle = getByTestId('notifications-switch');
    fireEvent(toggle, 'valueChange', false);
    
    // Check if AsyncStorage was called to save the preference
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('notificationsEnabled', 'false');
  });

  it('handles toggling dark mode', async () => {
    const { getByTestId } = render(<ProfileScreen />);
    
    await waitFor(() => expect(getByTestId('darkmode-switch')).toBeDefined());

    const toggle = getByTestId('darkmode-switch');
    fireEvent(toggle, 'valueChange', true);
    
    // Check if AsyncStorage was called to save the preference
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('colorScheme', 'dark');
  });

  it('handles toggling location services', async () => {
    const { getByTestId } = render(<ProfileScreen />);
    
    await waitFor(() => expect(getByTestId('location-switch')).toBeDefined());
    
    const toggle = getByTestId('location-switch');
    // Turn on location services
    fireEvent(toggle, 'valueChange', true);
    
    // Should request permissions
    await waitFor(() => {
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('locationEnabled', 'true');
    });
  });

  it('navigates to edit profile when edit button is pressed', async () => {
    const { getByTestId } = render(<ProfileScreen />);
    
    await waitFor(() => expect(getByTestId('edit-profile-button')).toBeDefined());
    
    fireEvent.press(getByTestId('edit-profile-button'));
    
    expect(router.push).toHaveBeenCalledWith('/edit-profile');
  });

  it('logs out the user when logout button is pressed', async () => {
    const { getByText } = render(<ProfileScreen />);
    
    await waitFor(() => expect(getByText('Logout')).toBeDefined());
    
    fireEvent.press(getByText('Logout'));
    
    // Should ask for confirmation, then log out
    const logoutFn = useAuth().logout;
    expect(logoutFn).toHaveBeenCalled();
  });

  it('handles error state', async () => {
    // Mock an error response
    patientService.getMyProfile.mockRejectedValueOnce(new Error('Network error'));
    
    const { getByText, queryByTestId } = render(<ProfileScreen />);
    
    await waitFor(() => {
      expect(queryByTestId('profile-loading')).toBeNull();
      expect(getByText('Failed to load profile')).toBeDefined();
    });
  });
});
