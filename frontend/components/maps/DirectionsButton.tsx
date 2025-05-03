import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Linking, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

interface DirectionsButtonProps {
  latitude: number;
  longitude: number;
  label?: string;
  compact?: boolean;
}

const DirectionsButton: React.FC<DirectionsButtonProps> = ({ 
  latitude, 
  longitude, 
  label = 'Destination',
  compact = false
}) => {
  const accentColor = useThemeColor({}, 'tint');

  const openDirections = () => {
    const encodedLabel = encodeURIComponent(label);
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&dname=${encodedLabel}`,
      android: `google.navigation:q=${latitude},${longitude}&title=${encodedLabel}`,
    });
    
    if (url) {
      Linking.canOpenURL(url)
        .then(supported => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            // Fallback to Google Maps website
            const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodedLabel}`;
            return Linking.openURL(webUrl);
          }
        })
        .catch(err => {
          Alert.alert('Error', 'Could not open maps application');
          console.error('Error opening directions:', err);
        });
    }
  };

  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactButton, { backgroundColor: accentColor }]} 
        onPress={openDirections}
      >
        <Ionicons name="navigate" size={16} color="#fff" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: accentColor }]} 
      onPress={openDirections}
    >
      <Ionicons name="navigate" size={18} color="#fff" />
      <Text style={styles.buttonText}>Directions</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  compactButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  }
});

export default DirectionsButton;