import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import FeedbackScreen from '../../app/(tabs)/feedback';
import feedbackService from '@/src/services/feedback.service';
import { router } from 'expo-router';
import { mockFeedbackData, mockPendingFeedback } from '../../__mocks__/feedbackServiceMock';

// Mock the services
jest.mock('@/src/services/feedback.service');
jest.mock('@/hooks/useColorScheme', () => () => 'light');

describe('FeedbackScreen', () => {
  beforeEach(() => {
    // Setup mocks before each test
    feedbackService.getMyFeedback.mockResolvedValue({
      success: true,
      data: mockFeedbackData
    });
    
    feedbackService.getPendingFeedback.mockResolvedValue({
      success: true,
      data: mockPendingFeedback
    });

    // Clear all router mock calls
    jest.clearAllMocks();
  });

  it('renders correctly with loading state', () => {
    const { getByTestId } = render(<FeedbackScreen />);
    expect(getByTestId('feedback-loading')).toBeDefined();
  });

  it('loads feedback data on mount and displays them', async () => {
    const { getByText, queryByTestId, getAllByTestId } = render(<FeedbackScreen />);
    
    // Should start with loading state
    expect(queryByTestId('feedback-loading')).toBeDefined();
    
    // Wait for the data to load
    await waitFor(() => {
      expect(queryByTestId('feedback-loading')).toBeNull();
      expect(getByText('Dr. John Smith')).toBeDefined();
      expect(getByText('Excellent doctor, very thorough and explained everything clearly.')).toBeDefined();
      
      // Check if we have the correct number of feedback cards
      const cards = getAllByTestId('feedback-card');
      expect(cards.length).toBe(mockFeedbackData.length);
    });
    
    // Check if the service was called
    expect(feedbackService.getMyFeedback).toHaveBeenCalled();
    expect(feedbackService.getPendingFeedback).toHaveBeenCalled();
  });

  it('shows pending feedback requests', async () => {
    const { getByText, getAllByTestId } = render(<FeedbackScreen />);
    
    await waitFor(() => {
      expect(getByText('Pending Feedback')).toBeDefined();
      const pendingCards = getAllByTestId('pending-feedback-card');
      expect(pendingCards.length).toBe(mockPendingFeedback.length);
      expect(getByText('Dr. Robert Lee')).toBeDefined();
    });
  });

  it('navigates to feedback form when pending feedback is pressed', async () => {
    const { getAllByTestId } = render(<FeedbackScreen />);
    
    await waitFor(() => {
      const pendingCards = getAllByTestId('pending-feedback-card');
      expect(pendingCards.length).toBeGreaterThan(0);
    });
    
    // Press the first pending feedback card
    fireEvent.press(getAllByTestId('pending-feedback-card')[0]);
    
    // Verify navigation
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/feedback-form',
      params: { appointmentId: mockPendingFeedback[0].id.toString() }
    });
  });

  it('shows rating stars correctly', async () => {
    const { getAllByTestId } = render(<FeedbackScreen />);
    
    await waitFor(() => {
      const ratingContainers = getAllByTestId('rating-stars');
      expect(ratingContainers.length).toBe(mockFeedbackData.length);
      
      // The first doctor has 5 stars
      const firstRatingContainer = ratingContainers[0];
      const filledStars = firstRatingContainer.findAllByTestId('star-filled');
      expect(filledStars.length).toBe(5);
    });
  });

  it('handles error state', async () => {
    // Mock an error response
    feedbackService.getMyFeedback.mockRejectedValueOnce(new Error('Network error'));
    
    const { getByText, queryByTestId } = render(<FeedbackScreen />);
    
    await waitFor(() => {
      expect(queryByTestId('feedback-loading')).toBeNull();
      expect(getByText('Failed to load feedback')).toBeDefined();
    });
  });

  it('navigates to edit feedback when edit button is pressed', async () => {
    const { getAllByTestId } = render(<FeedbackScreen />);
    
    await waitFor(() => {
      const editButtons = getAllByTestId('edit-feedback-button');
      expect(editButtons.length).toBeGreaterThan(0);
    });
    
    // Press the first edit button
    fireEvent.press(getAllByTestId('edit-feedback-button')[0]);
    
    // Verify navigation
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/edit-feedback',
      params: { feedbackId: mockFeedbackData[0].id.toString() }
    });
  });

  it('shows empty state when no feedback is available', async () => {
    // Mock an empty response
    feedbackService.getMyFeedback.mockResolvedValueOnce({
      success: true,
      data: []
    });
    
    const { getByText } = render(<FeedbackScreen />);
    
    await waitFor(() => {
      expect(getByText('You haven\'t provided any feedback yet')).toBeDefined();
    });
  });

  it('shows empty state when no pending feedback is available', async () => {
    // Mock an empty response
    feedbackService.getPendingFeedback.mockResolvedValueOnce({
      success: true,
      data: []
    });
    
    const { getByText } = render(<FeedbackScreen />);
    
    await waitFor(() => {
      expect(getByText('No pending feedback requests')).toBeDefined();
    });
  });
});
