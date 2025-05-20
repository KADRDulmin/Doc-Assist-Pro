import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import CustomMapView from './CustomMapView';
import { Marker } from '../common';
import type { LocationData, Region, Marker as MarkerType } from './types';

interface LocationSelectorProps {
  onLocationChange: (location: LocationData) => void;
  initialLocation?: LocationData;
  title?: string;
  height?: number;
}

export default function LocationSelector({
  onLocationChange,
  initialLocation,
  title = 'Select your location',
  height = 350,
}: LocationSelectorProps) {
  const [location, setLocation] = useState<LocationData | null>(initialLocation || null);
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  
  // Request location permission and get current location
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === 'granted');
        
        if (status === 'granted') {
          const currentLocation = await Location.getCurrentPositionAsync({});
          const newLocation = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          };
          setLocation(newLocation);
          updateMarkers(newLocation);
          
          // Get address from coordinates
          const addressResponse = await Location.reverseGeocodeAsync({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
          });
          
          if (addressResponse && addressResponse.length > 0) {
            const addressObj = addressResponse[0];
            const formattedAddress = [
              addressObj.name,
              addressObj.street,
              addressObj.district,
              addressObj.city,
              addressObj.region,
              addressObj.country,
            ]
              .filter(Boolean)
              .join(', ');
            
            setAddress(formattedAddress);
            
            const locationWithAddress = {
              ...newLocation,
              address: formattedAddress,
            };
            
            onLocationChange(locationWithAddress);
          } else {
            onLocationChange(newLocation);
          }
        }
      } catch (error) {
        console.log('Error getting location', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [initialLocation]);
  
  // Update markers when location changes
  const updateMarkers = (newLocation: LocationData) => {
    setMarkers([
      {
        coordinate: {
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
        },
        title: 'Selected Location',
        description: address || 'Your selected location',
      },
    ]);
  };
  
  // Handle map press to update location
  const handleMapPress = async (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    const newLocation = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    };
    
    setLocation(newLocation);
    updateMarkers(newLocation);
    
    setLoading(true);
    try {
      // Get address from coordinates
      const addressResponse = await Location.reverseGeocodeAsync(coordinate);
      
      if (addressResponse && addressResponse.length > 0) {
        const addressObj = addressResponse[0];
        const formattedAddress = [
          addressObj.name,
          addressObj.street,
          addressObj.district,
          addressObj.city,
          addressObj.region,
          addressObj.country,
        ]
          .filter(Boolean)
          .join(', ');
        
        setAddress(formattedAddress);
        
        const locationWithAddress = {
          ...newLocation,
          address: formattedAddress,
        };
        
        onLocationChange(locationWithAddress);
      } else {
        onLocationChange(newLocation);
      }
    } catch (error) {
      console.log('Error getting address', error);
      onLocationChange(newLocation);
    } finally {
      setLoading(false);
    }
  };
  
  // Use current location
  const useCurrentLocation = async () => {
    if (!locationPermission) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status !== 'granted') {
        return;
      }
    }
    
    setLoading(true);
    try {
      const currentLocation = await Location.getCurrentPositionAsync({});
      const newLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      
      setLocation(newLocation);
      updateMarkers(newLocation);
      
      // Get address from coordinates
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      });
      
      if (addressResponse && addressResponse.length > 0) {
        const addressObj = addressResponse[0];
        const formattedAddress = [
          addressObj.name,
          addressObj.street,
          addressObj.district,
          addressObj.city,
          addressObj.region,
          addressObj.country,
        ]
          .filter(Boolean)
          .join(', ');
        
        setAddress(formattedAddress);
        
        const locationWithAddress = {
          ...newLocation,
          address: formattedAddress,
        };
        
        onLocationChange(locationWithAddress);
      } else {
        onLocationChange(newLocation);
      }
    } catch (error) {
      console.log('Error getting current location', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (locationPermission === false) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.permissionText}>
          Location permission is required to use this feature.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(status === 'granted');
          }}
        >
          <Text style={styles.permissionButtonText}>Request Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { height }]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
        <View style={styles.mapContainer}>
        {location ? (
          <CustomMapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            markers={markers}
            onPress={handleMapPress}
            showUserLocation={true}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0a7ea4" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={useCurrentLocation}
          disabled={loading}
        >
          <Ionicons name="locate" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {address ? (
        <View style={styles.addressContainer}>
          <Ionicons name="location" size={20} color="#0a7ea4" />
          <Text style={styles.addressText} numberOfLines={2}>
            {address}
          </Text>
        </View>
      ) : null}
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text style={styles.loadingOverlayText}>
            {address ? 'Updating location...' : 'Getting location...'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#0a7ea4',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.9)',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  addressText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingOverlayText: {
    marginTop: 10,
    fontSize: 14,
  },
  permissionText: {
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  permissionButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default LocationSelector;