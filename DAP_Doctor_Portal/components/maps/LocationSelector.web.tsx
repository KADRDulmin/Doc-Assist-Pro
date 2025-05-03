// LocationSelector.web.tsx - Web-specific implementation of LocationSelector
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapComponent, { LocationData } from './MapComponent';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

interface LocationSelectorProps {
  initialLocation?: LocationData;
  onLocationSelected: (location: LocationData) => void;
  label?: string;
  required?: boolean;
  error?: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  initialLocation,
  onLocationSelected,
  label = 'Location',
  required = false,
  error,
}) => {
  const [isMapVisible, setIsMapVisible] = useState(!!initialLocation);
  const [location, setLocation] = useState<LocationData | undefined>(initialLocation);

  const handleLocationSelected = (newLocation: LocationData) => {
    setLocation(newLocation);
    onLocationSelected(newLocation);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      </View>

      {isMapVisible ? (
        <View style={styles.mapContainer}>
          <MapComponent
            initialLocation={location}
            onLocationSelected={handleLocationSelected}
            height={250}
          />
          
          {location && (
            <View style={styles.locationInfoContainer}>
              <Text style={styles.locationText}>{location.address}</Text>
              <TouchableOpacity 
                style={styles.changeButton}
                onPress={() => setIsMapVisible(false)}
              >
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setIsMapVisible(true)}
        >
          <Ionicons name="location" size={24} color={Colors.light.tint} />
          <Text style={styles.selectButtonText}>
            {location ? 'Change Location' : 'Select Location'}
          </Text>
        </TouchableOpacity>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  required: {
    color: 'red',
  },
  mapContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  locationInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.tint,
  },
  changeButton: {
    marginLeft: 10,
    padding: 5,
  },
  changeButtonText: {
    color: Colors.light.tint,
    fontWeight: '500',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
});

export default LocationSelector;