import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '../constants/Colors';

interface ThemedTextProps extends TextProps {
  variant?: 'primary' | 'secondary' | 'tertiary';
  type?: 'default' | 'heading' | 'subheading' | 'error';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  children: React.ReactNode;
}

export const ThemedText: React.FC<ThemedTextProps> = ({
  variant = 'primary',
  type = 'default',
  weight = 'normal',
  style,
  children,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';

  // Get text color based on variant and theme
  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return Colors[theme].text;
      case 'secondary':
        return Colors[theme].textSecondary;
      case 'tertiary':
        return Colors[theme].textTertiary;
      default:
        return Colors[theme].text;
    }
  };

  // Get text styles based on type
  const getTypeStyle = () => {
    switch (type) {
      case 'heading':
        return styles.heading;
      case 'subheading':
        return styles.subheading;
      case 'error':
        return { color: Colors[theme].danger };
      default:
        return {};
    }
  };

  // Get font weight style
  const getWeightStyle = () => {
    switch (weight) {
      case 'medium':
        return styles.medium;
      case 'semibold':
        return styles.semibold;
      case 'bold':
        return styles.bold;
      default:
        return styles.normal;
    }
  };

  return (
    <Text
      style={[
        { color: getTextColor() },
        getTypeStyle(),
        getWeightStyle(),
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  // Type styles
  heading: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  
  // Weight styles
  normal: {
    fontWeight: '400',
  },
  medium: {
    fontWeight: '500',
  },
  semibold: {
    fontWeight: '600',
  },
  bold: {
    fontWeight: '700',
  },
});
