import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
// Import our safe map component instead of using react-native-maps directly
import { SafeMapView, Marker, PROVIDER_GOOGLE } from '@/components/common';

// Import the web map loader utility (only used on web platform)
import loadGoogleMapsAPI from '@/src/utils/loadGoogleMapsAPI';

/**
 * Cross-platform Map component that works on iOS, Android, and Web
 */
export function CustomMapView({ 
  style, 
  initialRegion,
  markers = [],
  onRegionChange,
  showUserLocation = false,
  ...props 
}) {
  // When on web platform, we need to ensure Google Maps is loaded
  const [mapsLoaded, setMapsLoaded] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS === 'web') {
      loadGoogleMapsAPI(() => {
        setMapsLoaded(true);
      });
    }
  }, []);

  // Default region (Colombo, Sri Lanka)
  const defaultRegion = {
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  if (Platform.OS === 'web' && !mapsLoaded) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          {/* You can replace this with a loading indicator */}
          <View style={styles.loading} />
        </View>
      </View>
    );
  }

  return (
    <SafeMapView
      style={[styles.container, style]}
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion || defaultRegion}
      onRegionChange={onRegionChange}
      showUserLocation={showUserLocation}
      markers={markers}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: 300, // Default height
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  loading: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: '#0a7ea4',
    borderTopColor: 'transparent',
    borderRightColor: 'rgba(10, 126, 164, 0.5)',
    borderBottomColor: 'rgba(10, 126, 164, 0.8)',
  },
});

export default CustomMapView;