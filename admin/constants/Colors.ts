/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0066cc';  // Primary blue
const tintColorDark = '#0080ff';   // Slightly lighter blue for dark mode

export default {
  light: {
    text: '#333333',
    background: '#f8f9fa',
    tint: tintColorLight,
    icon: '#2f2f2f',
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ffffff',
    background: '#121212',
    tint: tintColorDark,
    icon: '#ffffff',
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};

// Add these additional color constants for easier access
export const Colors = {
  primary: '#0066cc',     // Main primary color (blue)
  secondary: '#00a86b',   // Secondary color (green)
  tertiary: '#444444',    // Tertiary color (dark grey)
  
  // UI colors
  background: '#f8f9fa',  // Background color
  white: '#ffffff',       // White
  text: '#333333',        // Default text color
  grey: '#888888',        // Grey text
  lightGrey: '#e0e0e0',   // Light grey for borders, etc.
  
  // Status colors
  success: '#28a745',     // Success (green)
  warning: '#ffc107',     // Warning (yellow)
  error: '#dc3545',       // Error/Danger (red)
  info: '#17a2b8',        // Info (cyan)
  
  // Additional UI elements
  border: '#dddddd',      // Border color
  lightPrimary: '#e6f0ff', // Light primary for backgrounds
  lightSecondary: '#e6fff5', // Light secondary for backgrounds
};
