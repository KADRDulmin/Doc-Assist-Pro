import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Switch, Text, useTheme } from 'react-native-paper';
import { useColorScheme } from '../../hooks/useColorScheme';

export function ThemeToggle() {
  const colorScheme = useColorScheme();
  const paperTheme = useTheme();
  
  // Since useColorScheme was enhanced with setColorScheme function
  const setColorScheme = (useColorScheme as any).setColorScheme;
  
  const isDarkMode = colorScheme === 'dark';
  
  const toggleTheme = () => {
    setColorScheme(isDarkMode ? 'light' : 'dark');
  };
  
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: paperTheme.colors.onBackground }]}>
        {isDarkMode ? 'Dark Mode' : 'Light Mode'}
      </Text>
      <Switch
        value={isDarkMode}
        onValueChange={toggleTheme}
        color={paperTheme.colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    fontSize: 16,
    marginRight: 8,
  }
});