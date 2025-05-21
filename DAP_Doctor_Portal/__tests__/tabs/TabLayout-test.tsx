import React from 'react';
import { render } from '@testing-library/react-native';

// Note: Common mocks are now in jest.setup.js
jest.mock('../../components/ui/ModernHeader', () => 'ModernHeader');

// Mock the TabLayout component
jest.mock('../../app/(tabs)/_layout', () => {
  const originalModule = jest.requireActual('../../app/(tabs)/_layout');
  return {
    __esModule: true,
    default: originalModule.default,
  };
});

import TabLayout from '../../app/(tabs)/_layout';

describe('<TabLayout />', () => {
  test('renders the TabLayout component', () => {
    const { UNSAFE_root } = render(<TabLayout />);
    
    // Check if Tabs component is rendered
    expect(UNSAFE_root.findByType('Tabs')).toBeTruthy();
  });
  
  test('renders correct number of tabs', () => {
    const { UNSAFE_getAllByProps } = render(<TabLayout />);
    
    // Check if all tab screens are rendered
    const tabs = UNSAFE_getAllByProps({ name: /index|appointments|patients|profile/ });
    expect(tabs).toHaveLength(4);
  });
  
  test('has appropriate tab icons', () => {
    const { UNSAFE_getAllByProps } = render(<TabLayout />);
    
    // Check if tab icons are rendered correctly
    const homeIcon = UNSAFE_getAllByProps({ name: "home" })[0];
    const calendarIcon = UNSAFE_getAllByProps({ name: "calendar-alt" })[0];
    const usersIcon = UNSAFE_getAllByProps({ name: "users" })[0];
    const profileIcon = UNSAFE_getAllByProps({ name: "user-md" })[0];
    
    expect(homeIcon).toBeTruthy();
    expect(calendarIcon).toBeTruthy();
    expect(usersIcon).toBeTruthy();
    expect(profileIcon).toBeTruthy();
  });
});
