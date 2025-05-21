import type { ViewStyle } from 'react-native';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface Marker {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface MapViewProps {
  style?: ViewStyle;
  initialRegion?: Region;
  markers?: Marker[];
  onRegionChange?: (region: Region) => void;
  showUserLocation?: boolean;
  onPress?: (event: any) => void;
  children?: React.ReactNode;
  provider?: any;
}
