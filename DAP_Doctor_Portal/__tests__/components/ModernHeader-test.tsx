import React from 'react';
import { render } from '@testing-library/react-native';
import ModernHeader from '../../components/ui/ModernHeader';

// Note: Global mocks are now in jest.setup.js

describe('<ModernHeader />', () => {
  test('renders the header with default props', () => {
    const { getByText } = render(<ModernHeader />);
    
    // Check if the default title is rendered
    expect(getByText('Doc Assist Pro')).toBeTruthy();
    
    // Check if the welcome text contains default username
    expect(getByText('Welcome back, Dr.')).toBeTruthy();
  });

  test('renders the header with custom title and username', () => {
    const { getByText } = render(
      <ModernHeader title="Custom Title" userName="Dr. Smith" />
    );
    
    // Check if the custom title is rendered
    expect(getByText('Custom Title')).toBeTruthy();
    
    // Check if the welcome text contains custom username
    expect(getByText('Welcome back, Dr. Smith')).toBeTruthy();
  });
  test('renders with back button when showBackButton is true', () => {
    const { UNSAFE_getByProps } = render(
      <ModernHeader showBackButton={true} />
    );
    
    // Check if the back button is rendered
    const backButton = UNSAFE_getByProps({ name: 'chevron-left' });
    expect(backButton).toBeTruthy();
  });

  test('renders notification badge with correct count', () => {
    const { getByTestId } = render(<ModernHeader />);
    
    // Check if the notification badge shows the correct number using testID
    const badgeText = getByTestId('notification-badge-text');
    expect(badgeText.props.children).toBe(5);
  });
  
  test('renders avatar with initials based on username', () => {
    const { getByTestId } = render(
      <ModernHeader userName="Dr. John Smith" />
    );
    
    // Check if the avatar shows the correct initials using testID
    const avatarText = getByTestId('avatar-text');
    expect(avatarText.props.children).toBe('DJS');
  });
});
