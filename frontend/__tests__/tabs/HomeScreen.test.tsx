import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../app/(tabs)/index';
import { useAuth } from '@/src/contexts/AuthContext';
import patientService from '@/src/services/patient.service';
import { router } from 'expo-router';
import { mockDashboardData } from '../../__mocks__/patientServiceMock';

// Mock the hooks and services
jest.mock('@/src/contexts/AuthContext');
jest.mock('@/src/services/patient.service');
jest.mock('@/hooks/useColorScheme', () => () => 'light');

describe('HomeScreen', () => {
  beforeEach(() => {
    // Setup mocks before each test
    useAuth.mockReturnValue({
      user: {
        id: 1,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane.doe@example.com',
      },
      isAuthenticated: true,
    });

    // Mock the patient service
    patientService.getDashboardData.mockResolvedValue({
      success: true,
      data: mockDashboardData
    });

    // Clear all router mock calls
    jest.clearAllMocks();
  });

  it('renders correctly with loading state', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('loading-indicator')).toBeDefined();
  });

  it('loads dashboard data on mount and displays user information', async () => {
    const { getByText, queryByTestId } = render(<HomeScreen />);
    
    // Should start with loading state
    expect(queryByTestId('loading-indicator')).toBeDefined();
    
    // Wait for the data to load
    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull();
      expect(getByText('Hello, Jane')).toBeDefined();
      expect(getByText('Jane Doe')).toBeDefined();
    });
    
    // Check if the service was called
    expect(patientService.getDashboardData).toHaveBeenCalled();
  });

  it('displays upcoming appointments when available', async () => {
    const { getByText, queryByTestId } = render(<HomeScreen />);
    
    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull();
      expect(getByText('Upcoming Appointments')).toBeDefined();
      expect(getByText('Dr. John Smith')).toBeDefined();
      expect(getByText('Regular Checkup')).toBeDefined();
    });
  });

  it('shows empty state when no upcoming appointments', async () => {
    // Override the mock to return no appointments
    patientService.getDashboardData.mockResolvedValueOnce({
      success: true,
      data: {
        ...mockDashboardData,
        upcomingAppointments: []
      }
    });

    const { getByText, queryByTestId } = render(<HomeScreen />);
    
    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull();
      expect(getByText('No upcoming appointments')).toBeDefined();
    });
  });

  it('navigates to new appointment screen when schedule button is pressed', async () => {
    const { getByText, queryByTestId } = render(<HomeScreen />);
    
    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull();
    });

    fireEvent.press(getByText('Schedule new appointment'));
    
    expect(router.push).toHaveBeenCalledWith({ pathname: '/new-appointment' });
  });

  it('handles error state', async () => {
    // Mock an error response
    patientService.getDashboardData.mockRejectedValueOnce(new Error('Network error'));
    
    const { getByText, queryByTestId } = render(<HomeScreen />);
    
    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull();
      expect(getByText('Something went wrong')).toBeDefined();
    });
  });
  
  it('can refresh the data when pull-to-refresh is triggered', async () => {
    const { getByTestId } = render(<HomeScreen />);
    
    await waitFor(() => expect(patientService.getDashboardData).toHaveBeenCalledTimes(1));
    
    // Find the ScrollView with refreshControl and trigger refresh
    const scrollView = getByTestId('home-scroll-view');
    fireEvent(scrollView, 'refresh');
    
    // Check that the service was called again
    await waitFor(() => expect(patientService.getDashboardData).toHaveBeenCalledTimes(2));
  });
});
