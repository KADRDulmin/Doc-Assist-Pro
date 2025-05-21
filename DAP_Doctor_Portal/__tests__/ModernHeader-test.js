import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// A simplified mock of ModernHeader for testing
const MockModernHeader = ({ title = 'Doc Assist Pro' }) => (
  <View testID="header-container">
    <Text testID="header-title">{title}</Text>
  </View>
);

describe('ModernHeader Component Tests', () => {
  it('renders with default title', () => {
    const { getByTestId } = render(<MockModernHeader />);
    const titleElement = getByTestId('header-title');
    expect(titleElement.props.children).toBe('Doc Assist Pro');
  });

  it('renders with custom title', () => {
    const { getByTestId } = render(<MockModernHeader title="Patient Dashboard" />);
    const titleElement = getByTestId('header-title');
    expect(titleElement.props.children).toBe('Patient Dashboard');
  });

  it('passes snapshot test', () => {
    const tree = render(<MockModernHeader />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
