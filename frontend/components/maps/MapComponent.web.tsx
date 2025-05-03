// MapComponent.web.tsx - Web-specific implementation of the map component
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoogleMap, Marker, useJsApiLoader, StandaloneSearchBox } from '@react-google-maps/api';
import { useThemeColor } from '@/hooks/useThemeColor';

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_WEB_GOOGLE_MAPS_API_KEY || 'AIzaSyCzmBUcvmUy2bvfTASC90DtXWqQi9l84_4';

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
  const accentColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  
  const [location, setLocation] = useState<LocationData | null>(initialLocation || null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [searchBoxRef, setSearchBoxRef] = useState<google.maps.places.SearchBox | null>(null);
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
    } else {
      getCurrentLocation();
    }
  }, [initialLocation]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          const newLocation = {
            latitude: lat,
            longitude: lng,
            address: await getAddressFromCoords(lat, lng),
          };
          
          setLocation(newLocation);
          
          if (onLocationSelected && editable) {
            onLocationSelected(newLocation);
          }
          
          if (mapRef) {
            mapRef.panTo({ lat, lng });
            mapRef.setZoom(DEFAULT_ZOOM);
          }
        },
        () => {
          setErrorMsg('Could not get your location. Please enable location services.');
        }
      );
    } else {
      setErrorMsg('Geolocation is not supported by this browser.');
    }
  };

  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return 'Unknown location';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Unknown location';
    }
  };

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (!editable || !event.latLng) return;
    
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    const address = await getAddressFromCoords(lat, lng);
    
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

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapRef(map);
  }, []);

  const onSearchBoxLoad = useCallback((searchBox: google.maps.places.SearchBox) => {
    setSearchBoxRef(searchBox);
  }, []);

  const onPlacesChanged = () => {
    if (searchBoxRef) {
      const places = searchBoxRef.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          
          const newLocation = {
            latitude: lat,
            longitude: lng,
            address: place.formatted_address || 'Selected location',
          };
          
          setLocation(newLocation);
          
          if (onLocationSelected) {
            onLocationSelected(newLocation);
          }
          
          if (mapRef) {
            mapRef.panTo({ lat, lng });
            mapRef.setZoom(DEFAULT_ZOOM);
          }
        }
      }
    }
  };

  const openDirections = () => {
    if (!location) return;
    
    const { latitude, longitude } = location;
    const label = encodeURIComponent(markerTitle || location.address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${label}`;
    window.open(url, '_blank');
  };

  if (loadError) {
    return (
      <View style={[styles.container, { height: height }]}>
        <Text style={styles.errorText}>Error loading maps</Text>
      </View>
    );
  }

  if (!isLoaded) {
    return (
      <View style={[styles.container, { height: height }]}>
        <Text>Loading maps...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: height }]}>
      {editable && (
        <View style={styles.searchContainer}>
          <StandaloneSearchBox
            onLoad={onSearchBoxLoad}
            onPlacesChanged={onPlacesChanged}
          >
            <input
              type="text"
              placeholder="Search for a location"
              style={{
                width: '100%',
                height: 40,
                padding: '0 10px',
                borderRadius: 5,
                border: '1px solid #ddd',
                boxSizing: 'border-box',
              }}
            />
          </StandaloneSearchBox>
        </View>
      )}
      
      <GoogleMap
        mapContainerStyle={{
          width: '100%',
          height: '100%',
        }}
        center={{
          lat: location?.latitude || DEFAULT_LATITUDE,
          lng: location?.longitude || DEFAULT_LONGITUDE,
        }}
        zoom={DEFAULT_ZOOM}
        onClick={handleMapClick}
        onLoad={onMapLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        {location && (
          <Marker
            position={{
              lat: location.latitude,
              lng: location.longitude
            }}
            title={markerTitle}
          />
        )}
      </GoogleMap>
      
      {editable && (
        <TouchableOpacity 
          style={styles.currentLocationButton} 
          onPress={getCurrentLocation}
        >
          <Ionicons name="locate" size={24} color={textColor} />
        </TouchableOpacity>
      )}
      
      {showDirectionsButton && location && (
        <TouchableOpacity 
          style={[styles.directionsButton, { backgroundColor: accentColor }]} 
          onPress={openDirections}
        >
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
  searchContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1,
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
  },
  directionsButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
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
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
  },
});

export default MapComponent;