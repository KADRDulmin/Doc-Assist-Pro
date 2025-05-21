import React from 'react';
import { render } from '@testing-library/react-native';
import ModernHeader from '../../components/ui/ModernHeader';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useNavigation: () => ({
    canGoBack: jest.fn(() => true),
    goBack: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('../../contexts/notificationContext', () => ({
  useNotifications: () => ({ unreadCount: 5 }),
}));

describe('ModernHeader component', () => {
  it('should render correctly', () => {
    // Basic test to check if component renders
    const { getByText } = render(<ModernHeader />);
    expect(getByText('Doc Assist Pro')).toBeTruthy();
  });
});
