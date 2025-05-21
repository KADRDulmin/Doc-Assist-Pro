// Mock implementation of @expo/vector-icons
import React from 'react';
import { Text } from 'react-native';

// A generic mock for all icon components
const createIconMock = (name) => {
  const Icon = ({ name, size, color, style, ...props }) => {
    return React.createElement(Text, { 
      style: [{ color }, style],
      ...props,
      testID: `icon-${name}` // Add testID for easier testing
    }, `[Icon ${name}]`);
  };

  return Icon;
};

// Create mocks for all commonly used icon sets
export const Ionicons = createIconMock('Ionicons');
export const Feather = createIconMock('Feather');
export const MaterialIcons = createIconMock('MaterialIcons');
export const FontAwesome5 = createIconMock('FontAwesome5');
export const MaterialCommunityIcons = createIconMock('MaterialCommunityIcons');
export const AntDesign = createIconMock('AntDesign');
export const FontAwesome = createIconMock('FontAwesome');
export const Entypo = createIconMock('Entypo');
export const Octicons = createIconMock('Octicons');
export const SimpleLineIcons = createIconMock('SimpleLineIcons');

// Default export to support both import styles
export default {
  Ionicons,
  Feather,
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
  AntDesign,
  FontAwesome,
  Entypo,
  Octicons,
  SimpleLineIcons
};
