import React from 'react';
import { View } from 'react-native';

// Mock router functions
const routerMock = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  setParams: jest.fn(),
  canGoBack: jest.fn(() => true),
};

// Mock components
const Link = ({ to, href, children, ...props }) => {
  return React.createElement(View, { ...props }, children);
};

const Stack = ({ children, ...props }) => {
  return React.createElement(View, { ...props }, children);
};

const Tabs = ({ children, ...props }) => {
  return React.createElement(View, { ...props }, children);
};

// Mock hooks
const useLocalSearchParams = jest.fn().mockReturnValue({});
const useNavigation = jest.fn().mockReturnValue(routerMock);
const usePathname = jest.fn().mockReturnValue('/');
const useRouter = jest.fn().mockReturnValue(routerMock);
const useSegments = jest.fn().mockReturnValue([]);

// Export all mocks
export {
  Link,
  Stack, 
  Tabs,
  useLocalSearchParams,
  useNavigation,
  usePathname,
  useRouter,
  useSegments
};

// Export router object
export const router = routerMock;
