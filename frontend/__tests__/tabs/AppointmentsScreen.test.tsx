import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AppointmentsScreen from '../../app/(tabs)/appointments';
import appointmentService from '@/src/services/appointment.service';
import { router } from 'expo-router';
import { mockAppointmentData } from '../../__mocks__/patientServiceMock';

// Mock the services
jest.mock('@/src/services/appointment.service');
jest.mock('@/hooks/useColorScheme', () => () => 'light');

describe('AppointmentsScreen', () => {
  beforeEach(() => {
    // Setup mocks before each test
    appointmentService.getMyAppointments.mockResolvedValue({
      success: true,
      data: mockAppointmentData
    });

    // Clear all router mock calls
    jest.clearAllMocks();
  });

  it('renders correctly with loading state', () => {
    const { getByTestId } = render(<AppointmentsScreen />);
    expect(getByTestId('appointments-loading')).toBeDefined();
  });

  it('loads appointments on mount and displays them', async () => {
    const { getByText, queryByTestId, getAllByTestId } = render(<AppointmentsScreen />);
    
    // Should start with loading state
    expect(queryByTestId('appointments-loading')).toBeDefined();
    
    // Wait for the data to load
    await waitFor(() => {
      expect(queryByTestId('appointments-loading')).toBeNull();
      expect(getByText('Dr. John Smith')).toBeDefined();
      
      // Check if we have the correct number of appointment cards
      const upcomingAppointments = mockAppointmentData.filter(a => a.status === 'upcoming');
      const cards = getAllByTestId('appointment-card');
      expect(cards.length).toBe(upcomingAppointments.length);
    });
    
    // Check if the service was called
    expect(appointmentService.getMyAppointments).toHaveBeenCalled();
  });

  it('filters appointments when tabs are changed', async () => {
    const { getByText, getAllByTestId } = render(<AppointmentsScreen />);
    
    await waitFor(() => {
      expect(getAllByTestId('appointment-card').length).toBe(1); // Only upcoming by default
    });
    
    // Switch to past tab
    fireEvent.press(getByText('Past'));
    
    await waitFor(() => {
      const pastAppointments = mockAppointmentData.filter(a => a.status === 'completed');
      const cards = getAllByTestId('appointment-card');
      expect(cards.length).toBe(pastAppointments.length);
      expect(getByText('Dr. Sarah Johnson')).toBeDefined();
    });
    
    // Switch to missed tab
    fireEvent.press(getByText('Missed'));
    
    await waitFor(() => {
      const missedAppointments = mockAppointmentData.filter(a => a.status === 'missed');
      const cards = getAllByTestId('appointment-card');
      expect(cards.length).toBe(missedAppointments.length);
      expect(getByText('Dr. Robert Lee')).toBeDefined();
    });
  });

  it('navigates to appointment details when an appointment is pressed', async () => {
    const { getAllByTestId } = render(<AppointmentsScreen />);
    
    await waitFor(() => {
      const cards = getAllByTestId('appointment-card');
      expect(cards.length).toBeGreaterThan(0);
    });
    
    // Press the first appointment card
    fireEvent.press(getAllByTestId('appointment-card')[0]);
    
    // Verify navigation
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/appointment-details',
      params: { appointmentId: mockAppointmentData.find(a => a.status === 'upcoming').id.toString() }
    });
  });

  it('handles error state', async () => {
    // Mock an error response
    appointmentService.getMyAppointments.mockRejectedValueOnce(new Error('Network error'));
    
    const { getByText, queryByTestId } = render(<AppointmentsScreen />);
    
    await waitFor(() => {
      expect(queryByTestId('appointments-loading')).toBeNull();
      expect(getByText('Something went wrong')).toBeDefined();
    });
  });

  it('navigates to new appointment screen when the add button is pressed', async () => {
    const { getByTestId } = render(<AppointmentsScreen />);
    
    await waitFor(() => {
      expect(getByTestId('add-appointment-button')).toBeDefined();
    });
    
    fireEvent.press(getByTestId('add-appointment-button'));
    
    expect(router.push).toHaveBeenCalledWith('/new-appointment');
  });
  
  it('shows empty state when no appointments in the selected tab', async () => {
    // Mock an empty response
    appointmentService.getMyAppointments.mockResolvedValueOnce({
      success: true,
      data: []
    });
    
    const { getByText, queryByTestId } = render(<AppointmentsScreen />);
    
    await waitFor(() => {
      expect(queryByTestId('appointments-loading')).toBeNull();
      expect(getByText('No appointments found')).toBeDefined();
    });
  });
  
  it('can refresh the data when pull-to-refresh is triggered', async () => {
    const { getByTestId } = render(<AppointmentsScreen />);
    
    await waitFor(() => expect(appointmentService.getMyAppointments).toHaveBeenCalledTimes(1));
    
    // Find the FlatList with refreshControl and trigger refresh
    const flatList = getByTestId('appointments-list');
    fireEvent(flatList, 'refresh');
    
    // Check that the service was called again
    await waitFor(() => expect(appointmentService.getMyAppointments).toHaveBeenCalledTimes(2));
  });
});
