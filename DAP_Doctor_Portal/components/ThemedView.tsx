import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '../constants/Colors';

interface ThemedViewProps extends ViewProps {
  variant?: 'primary' | 'secondary' | 'card' | 'cardAlt' | 'overlay';
  useShadow?: boolean;
  shadowIntensity?: 'light' | 'medium' | 'heavy';
  children: React.ReactNode;
}

export const ThemedView: React.FC<ThemedViewProps> = ({
  variant = 'primary',
  useShadow = false,
  shadowIntensity = 'medium',
  style,
  children,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';

  // Get background color based on variant and theme
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return Colors[theme].background;
      case 'secondary':
        return Colors[theme].backgroundSecondary;
      case 'card':
        return Colors[theme].card;
      case 'cardAlt':
        return Colors[theme].cardAlt;
      case 'overlay':
        return 'rgba(0, 0, 0, 0.5)'; // Semi-transparent overlay
      default:
        return Colors[theme].background;
    }
  };

  // Get shadow style based on intensity and theme
  const getShadowStyle = () => {
    if (!useShadow) return {};

    const baseShadow = {
      shadowColor: Colors[theme].shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    };

    switch (shadowIntensity) {
      case 'light':
        return {
          ...baseShadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        };
      case 'heavy':
        return {
          ...baseShadow,
          shadowColor: Colors[theme].shadowIntense,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        };
      default:
        return baseShadow;
    }
  };

  return (
    <View
      style={[
        { backgroundColor: getBackgroundColor() },
        useShadow && getShadowStyle(),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};
