import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import loadGoogleMapsAPI from '../../src/utils/loadGoogleMapsAPI';
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
  // When on web platform, we need to ensure Google Maps is loaded
  const [mapsLoaded, setMapsLoaded] = useState(Platform.OS !== 'web');
  const [webMapComponent, setWebMapComponent] = useState<{
    MapView: any;
    Marker: any;
  } | null>(null);

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

    const { MapView, Marker } = webMapComponent;

    return (
      <MapView
        style={[styles.container, style]}
        center={{ lat: initialRegion?.latitude || defaultRegion.latitude, lng: initialRegion?.longitude || defaultRegion.longitude }}
        zoom={12}
        onClick={onPress}
        {...props}
      >
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={{ 
              lat: marker.coordinate.latitude, 
              lng: marker.coordinate.longitude 
            }}
            title={marker.title}
            {...(marker.description && { label: marker.description })}
          />
        ))}
      </MapView>
    );
  }

  return (
    <SafeMapView
      style={[styles.container, style]}
      provider="google"
      initialRegion={initialRegion || defaultRegion}
      onRegionChange={onRegionChange}
      showsUserLocation={showUserLocation}
      onPress={onPress}
      {...props}
    >      {markers.map((marker, index) => (
        <Marker
          key={index}
          coordinate={marker.coordinate}
          title={marker.title}
          description={marker.description}
        />
      ))}
    </SafeMapView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loading: {
    width: 50,
    height: 50,
    backgroundColor: '#e0e0e0',
    borderRadius: 25,
  },
});