import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import loadGoogleMapsAPI from '@/src/utils/loadGoogleMapsAPI';
import { SafeMapView, Marker, PROVIDER_GOOGLE } from '@/components/common';

/**
 * Cross-platform Map component that works on iOS, Android, and Web
 */
export function CustomMapView({ 
  style, 
  initialRegion,
  markers = [],
  onRegionChange,
  showUserLocation = false,
  onPress,
  ...props 
}) {
  // When on web platform, we need to ensure Google Maps is loaded
  const [mapsLoaded, setMapsLoaded] = useState(Platform.OS !== 'web');
  const [webMapComponent, setWebMapComponent] = useState(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      loadGoogleMapsAPI(() => {
        // Dynamically import the web map component after Google Maps API is loaded
        import('@preflower/react-native-web-maps').then(WebMapModule => {
          setWebMapComponent({
            MapView: WebMapModule.default,
            Marker: WebMapModule.Marker
          });
          setMapsLoaded(true);
        }).catch(error => {
          console.error('Error loading web maps:', error);
        });
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

  if (Platform.OS === 'web') {
    if (!mapsLoaded || !webMapComponent) {
      return (
        <View style={[styles.container, style]}>
          <View style={styles.loadingContainer}>
            <View style={styles.loading} />
          </View>
        </View>
      );
    }

    // Use the dynamically loaded web components
    const WebMapView = webMapComponent.MapView;
    const WebMarker = webMapComponent.Marker;

    return (
      <WebMapView
        style={[styles.container, style]}
        initialRegion={initialRegion || defaultRegion}
        onRegionChange={onRegionChange}
        onClick={onPress} // Web uses onClick instead of onPress
        {...props}
      >
        {markers.map((marker, index) => (
          <WebMarker
            key={index}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
          />
        ))}
      </WebMapView>
    );
  }

  // For native platforms, use our SafeMapView component instead of direct MapView
  return (
    <SafeMapView
      style={[styles.container, style]}
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion || defaultRegion}
      onRegionChange={onRegionChange}
      showUserLocation={showUserLocation}
      onPress={onPress}
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
    // Add animation for the loading indicator
    animationName: 'spin',
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },
});

export default CustomMapView;