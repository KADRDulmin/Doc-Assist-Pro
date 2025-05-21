import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define marker type to avoid any type errors
interface MarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
  key?: string | number;
  position?: {
    lat: number;
    lng: number;
  };
}

// Different imports for web vs. native
let MapView: any, Marker: any, PROVIDER_GOOGLE: any;

if (Platform.OS === 'web') {
  try {
    // Import the web-specific maps package for web platform
    const WebMapView = require('@preflower/react-native-web-maps').default;
    MapView = WebMapView;
    Marker = WebMapView.Marker;
    PROVIDER_GOOGLE = null; // Not needed for web
  } catch (error) {
    console.warn('Web map components could not be imported:', error);
    // Create placeholder components for web
    MapView = ({ children, style }: { children?: React.ReactNode, style?: any }) => (
      <View style={[styles.mapFallback, style]}>
        <Ionicons name="map-outline" size={48} color="#888" />
        <Text style={styles.fallbackText}>Map unavailable</Text>
        <View>{children}</View>
      </View>
    );
    Marker = ({ children }: { children?: React.ReactNode }) => <View>{children || null}</View>;
    PROVIDER_GOOGLE = null;
  }
} else {
  try {
    // Regular react-native-maps import for native platforms
    const MapComponents = require('react-native-maps');
    MapView = MapComponents.default;
    Marker = MapComponents.Marker;
    PROVIDER_GOOGLE = MapComponents.PROVIDER_GOOGLE;
  } catch (error) {
    console.warn('Map components could not be imported:', error);
    // Create fallback components if native maps fail to load
    MapView = ({ children, style }: { children?: React.ReactNode, style?: any }) => (
      <View style={[styles.mapFallback, style]}>
        <Ionicons name="map-outline" size={48} color="#888" />
        <Text style={styles.fallbackText}>Map unavailable</Text>
        <View>{children}</View>
      </View>
    );
    Marker = ({ children }: { children?: React.ReactNode }) => <View>{children || null}</View>;
    PROVIDER_GOOGLE = null;
  }
}

// Props interface for SafeMapView
interface SafeMapViewProps {
  style?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showUserLocation?: boolean;
  onPress?: (event: any) => void;
  onRegionChange?: (region: any) => void;
  onRegionChangeComplete?: (region: any) => void;
  markers?: MarkerProps[];
  children?: React.ReactNode;
}

// A cross-platform safe MapView implementation
function SafeMapView({
  style,
  initialRegion,
  region,
  showUserLocation,
  onPress,
  onRegionChange,
  onRegionChangeComplete,
  markers,
  children,
}: SafeMapViewProps) {
  return (
    <MapView
      style={[styles.map, style]}
      initialRegion={initialRegion}
      region={region}
      showsUserLocation={showUserLocation}
      onPress={onPress}
      onRegionChange={onRegionChange}
      onRegionChangeComplete={onRegionChangeComplete}
      provider={PROVIDER_GOOGLE}
    >
      {/* Render markers if provided */}
      {markers?.map((marker: MarkerProps, index: number) => (
        <Marker
          key={marker.key || index}
          coordinate={marker.coordinate}
          title={marker.title}
          description={marker.description}
        />
      ))}
      {children}
    </MapView>
  );
}

// Styles for the component
const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
  mapFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

// Export the components
export { Marker, PROVIDER_GOOGLE };
export default SafeMapView;
