import { Platform } from 'react-native';
import FallbackMapView from './FallbackMapView';

// Use a try-catch to safely export map components and prevent app crashing
let CustomMapView, LocationSelector;

try {
  CustomMapView = require('./CustomMapView').default;
  LocationSelector = require('./LocationSelector').default;
} catch (error) {
  console.warn('Error loading map components:', error);
  // Provide fallbacks
  CustomMapView = FallbackMapView;
  LocationSelector = FallbackMapView;
}

export { CustomMapView, LocationSelector, FallbackMapView };
export type { LocationData } from './LocationSelector';