// Mock for expo-location
export default {
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => 
    Promise.resolve({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: 0,
        accuracy: 10,
        altitudeAccuracy: 10,
        heading: 0,
        speed: 0
      },
      timestamp: 1613968317834
    })
  ),
  watchPositionAsync: jest.fn(() => 
    Promise.resolve({
      remove: jest.fn()
    })
  ),
  hasServicesEnabledAsync: jest.fn(() => Promise.resolve(true)),
};
