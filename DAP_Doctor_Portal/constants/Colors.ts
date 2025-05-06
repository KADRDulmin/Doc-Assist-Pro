/**
 * Comprehensive color scheme for the Doctor Portal app
 * Supports both light and dark modes with consistent colors
 */
import { ColorValue } from 'react-native';

const tintColorLight = '#0466C8'; // Primary blue
const primaryColorLight = '#0466C8';
const secondaryColorLight = '#4CAF50'; // Success green
const accentColorLight = '#FF9F1C'; // Warm accent
const dangerColorLight = '#E71D36'; // Error/danger red

const tintColorDark = '#58B0ED'; // Lighter blue for dark mode
const primaryColorDark = '#58B0ED';
const secondaryColorDark = '#7BC47F'; // Lighter green for dark mode
const accentColorDark = '#FFBC5C'; // Lighter warm accent for dark mode
const dangerColorDark = '#FF5C5C'; // Lighter red for dark mode

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#555555',
    textTertiary: '#777777',
    background: '#FFFFFF',
    backgroundSecondary: '#F5F7FB',
    card: '#FFFFFF',
    cardAlt: '#F8F9FA',
    border: '#E1E5EB',
    borderLight: '#EEEEEE',
    tint: tintColorLight,
    primary: primaryColorLight,
    secondary: secondaryColorLight,
    accent: accentColorLight,
    danger: dangerColorLight,
    warning: '#FFC107',
    success: secondaryColorLight,
    info: primaryColorLight,
    icon: '#687076',
    tabIconDefault: '#8A9099',
    tabIconSelected: tintColorLight,
    statusBarStyle: 'dark',
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowIntense: 'rgba(0, 0, 0, 0.2)',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#B0B6BC',
    textTertiary: '#8A9099',
    background: '#121212',
    backgroundSecondary: '#1E1E1E',
    card: '#242424',
    cardAlt: '#2A2A2A',
    border: '#383838',
    borderLight: '#333333',
    tint: tintColorDark,
    primary: primaryColorDark,
    secondary: secondaryColorDark,
    accent: accentColorDark,
    danger: dangerColorDark,
    warning: '#FFD54F',
    success: secondaryColorDark,
    info: primaryColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#8A9099',
    tabIconSelected: tintColorDark,
    statusBarStyle: 'light',
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowIntense: 'rgba(0, 0, 0, 0.4)',
  },
};

// Common gradients used across the app
export const Gradients = {
  light: {
    primary: ['#0466C8', '#0353A4'] as readonly [ColorValue, ColorValue],
    secondary: ['#4CAF50', '#388E3C'] as readonly [ColorValue, ColorValue],
    accent: ['#FF9F1C', '#F17105'] as readonly [ColorValue, ColorValue],
    danger: ['#E71D36', '#C11426'] as readonly [ColorValue, ColorValue],
    header: ['#0466C8', '#0353A4'] as readonly [ColorValue, ColorValue], // Blue gradient for light mode
    card: ['#F8F9FA', '#F0F1F3'] as readonly [ColorValue, ColorValue],
  },
  dark: {
    primary: ['#58B0ED', '#0466C8'] as readonly [ColorValue, ColorValue],
    secondary: ['#7BC47F', '#4CAF50'] as readonly [ColorValue, ColorValue],
    accent: ['#FFBC5C', '#FF9F1C'] as readonly [ColorValue, ColorValue],
    danger: ['#FF5C5C', '#E71D36'] as readonly [ColorValue, ColorValue],
    header: ['#1560BD', '#023E7D'] as readonly [ColorValue, ColorValue], // Darker blue gradient for dark mode
    card: ['#242424', '#1A1A1A'] as readonly [ColorValue, ColorValue],
  }
};

export default Colors;
