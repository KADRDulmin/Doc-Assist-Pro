import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeMapView, Marker } from '../common';
import type { MapViewProps } from './types';

/**
 * Cross-platform Map component that works on iOS, Android, and Web
 */
export default function CustomMapView({ 
  style, 
  initialRegion,
  markers = [],
  onRegionChange,
  showUserLocation = false,
  onPress,
  ...props 
}: MapViewProps) {
  const [mapError, setMapError] = useState<string | null>(null);
  // If there's an error loading the map
  if (mapError) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>
            {mapError || 'There was a problem loading the map'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <SafeMapView
        style={styles.map}
        initialRegion={initialRegion}
        showUserLocation={showUserLocation}
        onRegionChange={onRegionChange}
        onPress={onPress}
        markers={markers}
        {...props}
      >
        {markers && markers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
          />
        ))}      </SafeMapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 300,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 8,
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#495057',
    fontSize: 16,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 5,
  }
});
