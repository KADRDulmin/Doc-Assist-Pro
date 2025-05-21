/**
 * Test Runner for Doc Assist Pro tests
 * This script demonstrates how to use the simplified jest setup
 */

import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import React from 'react';

// Basic component to verify testing works
const TestComponent = () => <Text testID="test-component">Testing works!</Text>;

describe('Test setup validation', () => {
  test('Basic render test works', () => {
    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('test-component')).toBeTruthy();
  });

  test('Mock system is working', async () => {
    // Test AsyncStorage mock
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem('test', 'value');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('test', 'value');
    
    // Test Expo Router mock
    const router = require('expo-router').useRouter();
    router.push('/test');
    expect(router.push).toHaveBeenCalledWith('/test');
  });
});
