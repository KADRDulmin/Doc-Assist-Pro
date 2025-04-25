import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface SafeAreaLayoutProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disableTop?: boolean;
  disableBottom?: boolean;
  backgroundColor?: string;
}

export function SafeAreaLayout({
  children,
  style,
  disableTop = false,
  disableBottom = false,
  backgroundColor,
}: SafeAreaLayoutProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  
  const defaultBackgroundColor = backgroundColor || Colors[colorScheme ?? 'light'].background;

  const containerStyle = {
    paddingTop: disableTop ? 0 : insets.top,
    paddingBottom: disableBottom ? 0 : insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
    backgroundColor: defaultBackgroundColor,
    flex: 1,
  };

  return (
    <View style={[containerStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});