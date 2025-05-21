import React from 'react';
import { render } from '@testing-library/react-native';
import PlaceholderScreen from '../../app/(tabs)/placeholder';

describe('PlaceholderScreen', () => {  it('renders an empty view', () => {
    // The placeholder screen should render without errors
    const { UNSAFE_root } = render(<PlaceholderScreen />);
    
    // It should just be an empty view with no content
    expect(UNSAFE_root).toBeDefined();
    expect(UNSAFE_root.children.length).toBe(0);
  });
});
