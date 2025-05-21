import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Different imports for web vs. native
let MapView: any, Marker: any, PROVIDER_GOOGLE: any;

try {
  if (Platform.OS === 'web') {
    // Import the web-specific maps package for web platform
    const WebMapView = require('@preflower/react-native-web-maps').default;
    MapView = WebMapView;
    Marker = WebMapView.Marker;
    PROVIDER_GOOGLE = null; // Not needed for web
  } else {
    // Regular react-native-maps import for native platforms
    const MapComponents = require('react-native-maps');
    MapView = MapComponents.default;
    Marker = MapComponents.Marker;
    PROVIDER_GOOGLE = MapComponents.PROVIDER_GOOGLE;
  }
} catch (error) {
  console.warn('Map components could not be imported:', error);
  // Create placeholder components for when maps can't be loaded
  MapView = ({ children, style }: { children?: React.ReactNode, style?: any }) => (
    <View style={[styles.mapFallback, style]}>
      <Ionicons name="map-outline" size={48} color="#888" />
      <Text style={styles.fallbackText}>Map unavailable</Text>
      <Text style={styles.fallbackSubtext}>Please check your connection</Text>
      <View>{children}</View>
    </View>
  );
  Marker = ({ children }: { children?: React.ReactNode }) => <View>{children}</View>;
  PROVIDER_GOOGLE = null;
}

/**
 * A safe wrapper around MapView that handles native module errors
 * and provides consistent behavior across platforms
 */
const SafeMapView = ({
  style,
  initialRegion,
  markers = [],
  onRegionChange,
  showUserLocation = false,
  onPress,
  children,
  ...props
}: any) => {
  // Default region (Sri Lanka)
  const defaultRegion = {
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Try to render the MapView, catch any errors
  try {
    if (Platform.OS === 'web') {
      // Web implementation
      return (
        <MapView
          style={[styles.map, style]}
          defaultCenter={{
            lat: initialRegion?.latitude || defaultRegion.latitude,
            lng: initialRegion?.longitude || defaultRegion.longitude,
          }}
          defaultZoom={12}
          {...props}
        >
          {markers.map((marker: any, index: number) => (
            <Marker
              key={index}
              position={{
                lat: marker.coordinate.latitude,
                lng: marker.coordinate.longitude,
              }}
              title={marker.title}
            />
          ))}
          {children}
        </MapView>
      );
    } else {
      // Native implementation
      return (
        <MapView
          style={[styles.map, style]}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion || defaultRegion}
          onRegionChange={onRegionChange}
          showsUserLocation={showUserLocation}
          onPress={onPress}
          {...props}
        >
          {markers.map((marker: any, index: number) => (
            <Marker
              key={index}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
            />
          ))}
          {children}
        </MapView>
      );
    }
  } catch (error) {
    console.warn('Error rendering MapView:', error);
    return (
      <View style={[styles.mapFallback, style]}>
        <Ionicons name="map-outline" size={48} color="#888" />
        <Text style={styles.fallbackText}>Map unavailable</Text>
        <Text style={styles.fallbackSubtext}>Please check your connection</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 300,
  },
  mapFallback: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  fallbackText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  fallbackSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
  },
});

// Type augmentation for static properties
interface SafeMapViewComponent extends React.FC<SafeMapViewProps> {
  Marker: typeof Marker;
}

// Create the component with static properties
const SafeMapViewWithMarker = SafeMapView as SafeMapViewComponent;
SafeMapViewWithMarker.Marker = Marker;

export default SafeMapViewWithMarker;
export { Marker, PROVIDER_GOOGLE };

// Interface definitions
interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MarkerType {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
}

interface SafeMapViewProps {
  style?: any;
  initialRegion?: Region;
  markers?: MarkerType[];
  onRegionChange?: (region: Region) => void;
  showUserLocation?: boolean;
  onPress?: (event: any) => void;
  children?: React.ReactNode;
  [key: string]: any;
}