import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

/**
 * Fallback Map Component when maps can't be loaded
 * This helps prevent crashes when the RNMapsAirModule error occurs
 */
const FallbackMapView = ({ style, children, ...props }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.fallbackContent}>
        <Text style={styles.fallbackText}>Map unavailable</Text>
        <Text style={styles.fallbackSubtext}>Please check your connection or permissions</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  fallbackContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fallbackText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
  },
  fallbackSubtext: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
});

export default FallbackMapView;