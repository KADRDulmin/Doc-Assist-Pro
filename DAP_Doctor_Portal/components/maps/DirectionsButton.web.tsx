// DirectionsButton.web.tsx - Web-specific implementation of DirectionsButton
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

interface DirectionsButtonProps {
  latitude: number;
  longitude: number;
  label?: string;
  title?: string;
  compact?: boolean;
}

const DirectionsButton: React.FC<DirectionsButtonProps> = ({
  latitude,
  longitude,
  label = 'Get Directions',
  title = 'Destination',
  compact = false
}) => {
  const openDirections = () => {
    // For web, open Google Maps in a new tab
    const encodedTitle = encodeURIComponent(title);
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodedTitle}`;
    window.open(webUrl, '_blank');
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactButton} onPress={openDirections}>
        <Ionicons name="navigate" size={18} color={Colors.light.tint} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.button} onPress={openDirections}>
      <Ionicons name="navigate" size={20} color="#fff" />
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  compactButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
});

export default DirectionsButton;