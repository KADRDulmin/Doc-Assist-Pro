import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Platform, Linking, Alert, ViewStyle } from 'react-native';
// Import our safe map component instead of using react-native-maps directly
import { SafeMapView, Marker, PROVIDER_GOOGLE } from '../common';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyCOZ2LqiS0C3fxrtMujZQU8O-_o02Tvgnc';

// Default coordinates (center of Sri Lanka as fallback)
const DEFAULT_LATITUDE = 7.8731;
const DEFAULT_LONGITUDE = 80.7718;
const DEFAULT_DELTA = 0.0922;

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
  const [location, setLocation] = useState<LocationData | null>(initialLocation || null);
  const [currentRegion, setCurrentRegion] = useState({
    latitude: initialLocation?.latitude || DEFAULT_LATITUDE,
    longitude: initialLocation?.longitude || DEFAULT_LONGITUDE,
    latitudeDelta: DEFAULT_DELTA,
    longitudeDelta: DEFAULT_DELTA,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
      setCurrentRegion({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: DEFAULT_DELTA,
        longitudeDelta: DEFAULT_DELTA,
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
      
      const newRegion = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
        latitudeDelta: DEFAULT_DELTA,
        longitudeDelta: DEFAULT_DELTA,
      };
      
      setCurrentRegion(newRegion);
      
      // Reverse geocode to get the address
      const geocode = await Location.reverseGeocodeAsync({
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
      });
      
      if (geocode && geocode.length > 0) {
        const address = formatAddress(geocode[0]);
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

  const formatAddress = (addressObj: Location.LocationGeocodedAddress): string => {
    const { street, city, region, country, postalCode } = addressObj;
    const addressParts = [street, city, region, country, postalCode].filter(Boolean);
    return addressParts.join(', ');
  };

  const handleMapPress = async (event: any) => {
    if (!editable) return;
    
    const { coordinate } = event.nativeEvent;
    
    // Reverse geocode to get the address
    const geocode = await Location.reverseGeocodeAsync({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
    
    if (geocode && geocode.length > 0) {
      const address = formatAddress(geocode[0]);
      const newLocation = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address,
      };
      
      setLocation(newLocation);
      
      if (onLocationSelected) {
        onLocationSelected(newLocation);
      }
      
      // Clear the search input
      if (autocompleteRef.current) {
        autocompleteRef.current.clear();
      }
    }
  };

  const openDirections = () => {
    if (!location) return;
    
    const { latitude, longitude } = location;
    const label = encodeURIComponent(markerTitle || location.address);
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&dname=${label}`,
      android: `google.navigation:q=${latitude},${longitude}&title=${label}`,
    });
    
    if (url) {
      Linking.canOpenURL(url)
        .then(supported => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            // Fallback to Google Maps website
            const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${label}`;
            return Linking.openURL(webUrl);
          }
        })
        .catch(err => {
          Alert.alert('Error', 'Could not open maps application');
          console.error('Error opening directions:', err);
        });
    }
  };

  return (
    <View style={[styles.container, { height: height as number }]}>      {editable && Platform.OS !== 'web' && (
        <View style={styles.searchContainer}>
          <GooglePlacesAutocomplete
            ref={autocompleteRef}
            placeholder="Search for a location"
            fetchDetails={true}
            renderDescription={data => data.description}
            suppressDefaultStyles={false}
            enablePoweredByContainer={false}
            onPress={(data, details = null) => {
              if (details) {
                const newRegion = {
                  latitude: details.geometry.location.lat,
                  longitude: details.geometry.location.lng,
                  latitudeDelta: DEFAULT_DELTA,
                  longitudeDelta: DEFAULT_DELTA,
                };
                
                const newLocation = {
                  latitude: details.geometry.location.lat,
                  longitude: details.geometry.location.lng,
                  address: data.description,
                };
                
                setCurrentRegion(newRegion);
                setLocation(newLocation);
                
                if (onLocationSelected) {
                  onLocationSelected(newLocation);
                }
                
                mapRef.current?.animateToRegion(newRegion);
              }
            }}
            query={{
              key: GOOGLE_MAPS_API_KEY,
              language: 'en',
            }}
            styles={{
              container: styles.autocompleteContainer,
              textInput: styles.autocompleteInput,
              listView: styles.autocompleteList,
            }}
          />
        </View>
      )}
      
      {/* Replace MapView with SafeMapView */}
      <SafeMapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={currentRegion}
        onRegionChange={setCurrentRegion}
        onPress={handleMapPress}
        showUserLocation={true}
        markers={location ? [
          {
            coordinate: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
            title: markerTitle,
            description: location.address,
          }
        ] : []}
      />
      
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1,
  },
  autocompleteContainer: {
    flex: 0,
    width: '100%',
    zIndex: 2,
  },
  autocompleteInput: {
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  autocompleteList: {
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 2,
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