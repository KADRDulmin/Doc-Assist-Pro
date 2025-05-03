import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapComponent, { LocationData } from './MapComponent';
import { useThemeColor } from '@/hooks/useThemeColor';

interface LocationSelectorProps {
  initialLocation?: LocationData;
  onLocationChange: (location: LocationData) => void;
  title?: string;
  height?: number;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  initialLocation,
  onLocationChange,
  title = 'Select Your Location',
  height = 350
}) => {
  const [selected, setSelected] = useState<LocationData | undefined>(initialLocation);
  const textColor = useThemeColor({}, 'text');
  
  useEffect(() => {
    if (initialLocation) {
      setSelected(initialLocation);
    }
  }, [initialLocation]);

  const handleLocationSelected = (location: LocationData) => {
    setSelected(location);
    onLocationChange(location);
  };

  return (
    <View style={styles.container}>
      {title && <Text style={[styles.title, { color: textColor }]}>{title}</Text>}
      
      <MapComponent
        initialLocation={selected}
        onLocationSelected={handleLocationSelected}
        editable={true}
        height={height}
      />
      
      {selected && (
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Selected Address:</Text>
          <Text style={styles.addressText}>{selected.address}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addressContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addressLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
  }
});

export default LocationSelector;