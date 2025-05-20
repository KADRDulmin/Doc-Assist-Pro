import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

/**
 * Fallback Map Component when maps can't be loaded
 * This helps prevent crashes when the RNMapsAirModule error occurs
 */
const FallbackMapView = ({ style, children, initialRegion, markers, ...props }) => {
  // Extract location from initialRegion or markers to display it
  const locationText = initialRegion 
    ? `Lat: ${initialRegion.latitude.toFixed(4)}, Long: ${initialRegion.longitude.toFixed(4)}`
    : markers && markers.length > 0
      ? `Lat: ${markers[0].coordinate.latitude.toFixed(4)}, Long: ${markers[0].coordinate.longitude.toFixed(4)}`
      : 'No location data';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.fallbackContent}>
        <Text style={styles.fallbackText}>Map unavailable</Text>
        <Text style={styles.fallbackSubtext}>Please check your connection or permissions</Text>
        <Text style={styles.locationText}>{locationText}</Text>
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
  },  fallbackSubtext: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    padding: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
});

export default FallbackMapView;