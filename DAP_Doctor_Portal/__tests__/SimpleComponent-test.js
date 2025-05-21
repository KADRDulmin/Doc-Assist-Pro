import React from 'react';
import { Text } from 'react-native';

// This is a minimal test to confirm Jest is working properly
// No dependencies that might cause issues

describe('Jest Framework Tests', () => {
  it('true should be true', () => {
    expect(true).toBe(true);
  });
  
  it('basic addition should work', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('should pass with simple React elements', () => {
    const element = <Text>Hello</Text>;
    expect(element.props.children).toBe('Hello');
  });
});
