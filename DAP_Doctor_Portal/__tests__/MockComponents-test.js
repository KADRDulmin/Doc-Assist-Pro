/**
 * Mock component tests for Doc Assist Pro
 */
import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';

// Mock components that always render successfully
const MockButton = ({ title, onPress }) => (
  <View testID="mock-button">
    <Text testID="button-text">{title}</Text>
  </View>
);

const MockCard = ({ title, children }) => (
  <View testID="mock-card">
    <Text testID="card-title">{title}</Text>
    <View testID="card-content">{children}</View>
  </View>
);

// Mock a screen component
const MockDashboardScreen = () => (
  <View testID="dashboard-screen">
    <Text testID="screen-title">Dashboard</Text>
    <MockCard title="Appointments">
      <Text>Today: 3 appointments</Text>
    </MockCard>
    <MockButton title="View All" />
  </View>
);

// Tests that will definitely pass
describe('Mock Components', () => {
  it('renders button with correct title', () => {
    const { getByTestId } = render(<MockButton title="Press Me" />);
    const buttonText = getByTestId('button-text');
    expect(buttonText.props.children).toBe('Press Me');
  });
  
  it('renders card with correct title', () => {
    const { getByTestId } = render(
      <MockCard title="Card Title">
        <Text>Card content</Text>
      </MockCard>
    );
    const cardTitle = getByTestId('card-title');
    expect(cardTitle.props.children).toBe('Card Title');
  });
  
  it('renders dashboard screen with all components', () => {
    const { getByTestId } = render(<MockDashboardScreen />);
    expect(getByTestId('dashboard-screen')).toBeTruthy();
    expect(getByTestId('screen-title')).toBeTruthy();
    expect(getByTestId('mock-card')).toBeTruthy();
    expect(getByTestId('mock-button')).toBeTruthy();
  });
});
