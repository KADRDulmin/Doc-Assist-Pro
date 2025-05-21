import React from 'react';
import { View } from 'react-native';

// Mock implementation of expo-linear-gradient
export const LinearGradient = ({ children, style, colors, ...props }) => {
  return React.createElement(
    View,
    {
      style: [
        { backgroundColor: colors ? colors[0] : 'transparent' },
        style
      ],
      testID: 'linear-gradient',
      ...props
    },
    children
  );
};

export default {
  LinearGradient
};
