import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TabLayout from '../../app/(tabs)/_layout';
import { router } from 'expo-router';

// Mock the necessary modules
jest.mock('@/hooks/useColorScheme', () => () => 'light');
jest.mock('expo-router', () => {
  const actualExpoRouter = jest.requireActual('expo-router');
  return {
    ...actualExpoRouter,
    Tabs: ({ children }) => <>{children}</>,
    'Tabs.Screen': ({ name, options }) => <div data-testid={`tab-${name}`} data-options={JSON.stringify(options)} />,
  };
});

describe('TabLayout', () => {
  beforeEach(() => {
    // Clear all router mock calls
    jest.clearAllMocks();
  });
  
  it('renders all tabs correctly', () => {
    const { getByTestId } = render(<TabLayout />);
    
    // Check that all tabs are rendered
    expect(getByTestId('tab-index')).toBeDefined();
    expect(getByTestId('tab-appointments')).toBeDefined();
    expect(getByTestId('tab-placeholder')).toBeDefined();
    expect(getByTestId('tab-feedback')).toBeDefined();
    expect(getByTestId('tab-profile')).toBeDefined();
  });
  
  it('renders FAB button', () => {
    const { getByTestId } = render(<TabLayout />);
    
    // The floating action button should be rendered
    expect(getByTestId('fab-button')).toBeDefined();
  });
  
  it('opens FAB menu when FAB is pressed', () => {
    const { getByTestId, queryByTestId } = render(<TabLayout />);
    
    // FAB menu should not be visible initially
    expect(queryByTestId('fab-menu-item-consultation')).toBeNull();
    
    // Press the FAB button
    fireEvent.press(getByTestId('fab-button'));
    
    // Now the menu items should be visible
    expect(getByTestId('fab-menu-item-consultation')).toBeDefined();
    expect(getByTestId('fab-menu-item-followup')).toBeDefined();
  });
  
  it('navigates to symptom analysis when new consultation is pressed', () => {
    const { getByTestId } = render(<TabLayout />);
    
    // Open the FAB menu
    fireEvent.press(getByTestId('fab-button'));
    
    // Press the new consultation button
    fireEvent.press(getByTestId('fab-menu-item-consultation'));
    
    // Check navigation
    expect(router.push).toHaveBeenCalledWith('/symptom-analysis');
  });
  
  it('navigates to follow-up appointment when follow-up button is pressed', () => {
    const { getByTestId } = render(<TabLayout />);
    
    // Open the FAB menu
    fireEvent.press(getByTestId('fab-button'));
    
    // Press the follow-up button
    fireEvent.press(getByTestId('fab-menu-item-followup'));
    
    // Check navigation
    expect(router.push).toHaveBeenCalledWith('/appointments/follow-up');
  });
  
  it('closes FAB menu when an option is selected', () => {
    const { getByTestId, queryByTestId } = render(<TabLayout />);
    
    // Open the FAB menu
    fireEvent.press(getByTestId('fab-button'));
    
    // Menu items should be visible
    expect(getByTestId('fab-menu-item-consultation')).toBeDefined();
    
    // Select an option
    fireEvent.press(getByTestId('fab-menu-item-consultation'));
    
    // Menu should be closed (animation would handle this in real component)
    // This is testing the logic of setting fabMenuOpen to false
    expect(queryByTestId('fab-menu-item-consultation')).toBeNull();
  });
});
