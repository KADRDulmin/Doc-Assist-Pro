// MapComponent.web.tsx - Web-specific implementation of Map Component
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, Linking, Alert } from 'react-native';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_ANDROID_GOOGLE_MAPS_API_KEY || 'AIzaSyB1Z8pG1vskS6u7mUBBW2y-_5Y1Besd3ts';

// Default coordinates (center of Sri Lanka as fallback)
const DEFAULT_LATITUDE = 7.8731;
const DEFAULT_LONGITUDE = 80.7718;
const DEFAULT_ZOOM = 10;

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

interface MapComponentProps {
  initialLocation?: LocationData;
  onLocationSelected?: (location: LocationData) => void;
  editable?: boolean;
  showDirectionsButton?: boolean;
  markerTitle?: string;
  height?: number;
}

const MapComponent: React.FC<MapComponentProps> = ({
  initialLocation,
  onLocationSelected,
  editable = true,
  showDirectionsButton = false,
  markerTitle = 'Selected Location',
  height = 300,
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const [location, setLocation] = useState<LocationData | null>(initialLocation || null);
  const [center, setCenter] = useState({
    lat: initialLocation?.latitude || DEFAULT_LATITUDE,
    lng: initialLocation?.longitude || DEFAULT_LONGITUDE
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
      setCenter({
        lat: initialLocation.latitude,
        lng: initialLocation.longitude
      });
    } else {
      getCurrentLocation();
    }
  }, [initialLocation]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const locationResult = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      
      const newCenter = {
        lat: locationResult.coords.latitude,
        lng: locationResult.coords.longitude
      };
      
      setCenter(newCenter);
      
      // For web, we'll use browser's Geocoder API when available
      if (navigator.geolocation) {
        const address = `${locationResult.coords.latitude}, ${locationResult.coords.longitude}`;
        const newLocation = {
          latitude: locationResult.coords.latitude,
          longitude: locationResult.coords.longitude,
          address,
        };
        
        setLocation(newLocation);
        
        if (onLocationSelected && editable) {
          onLocationSelected(newLocation);
        }
      }
    } catch (error) {
      setErrorMsg('Could not get your location');
      console.error('Error getting location:', error);
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!editable || !e.latLng) return;
    
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    
    // Simple address for web version
    const address = `${lat}, ${lng}`;
    const newLocation = {
      latitude: lat,
      longitude: lng,
      address,
    };
    
    setLocation(newLocation);
    
    if (onLocationSelected) {
      onLocationSelected(newLocation);
    }
  };

  const openDirections = () => {
    if (!location) return;
    
    const { latitude, longitude } = location;
    const label = encodeURIComponent(markerTitle || location.address);
    
    // For web, open Google Maps in a new tab
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${label}`;
    window.open(webUrl, '_blank');
  };

  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  const onUnmount = () => {
    mapRef.current = null;
  };

  if (!isLoaded) return <View style={[styles.container, { height: height }]}><Text>Loading maps...</Text></View>;
  
  return (
    <View style={[styles.container, { height: height }]}>
      <div style={{ height: '100%', width: '100%' }}>
        <GoogleMap
          mapContainerStyle={{ height: '100%', width: '100%' }}
          center={center}
          zoom={DEFAULT_ZOOM}
          onClick={handleMapClick}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {location && (
            <Marker
              position={{ lat: location.latitude, lng: location.longitude }}
              title={markerTitle}
            />
          )}
        </GoogleMap>
      </div>
      
      {editable && (
        <TouchableOpacity style={styles.currentLocationButton} onPress={getCurrentLocation}>
          <Ionicons name="locate" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      )}
      
      {showDirectionsButton && location && (
        <TouchableOpacity style={styles.directionsButton} onPress={openDirections}>
          <Ionicons name="navigate" size={20} color="#fff" />
          <Text style={styles.directionsButtonText}>Directions</Text>
        </TouchableOpacity>
      )}
      
      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 10,
  },
  directionsButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: Colors.light.tint,
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 10,
  },
  directionsButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
    zIndex: 10,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
  },
});

export default MapComponent;