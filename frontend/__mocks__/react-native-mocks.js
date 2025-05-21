// Mock for important React Native components
jest.mock('react-native-safe-area-context', () => {
  const inset = {top: 0, right: 0, bottom: 0, left: 0};
  return {
    ...jest.requireActual('react-native-safe-area-context'),
    useSafeAreaInsets: jest.fn().mockImplementation(() => inset),
    SafeAreaProvider: jest.fn(({children}) => children),
    SafeAreaView: jest.fn(({children}) => children),
  };
});

// Mock for react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('React');
  const MapView = jest.fn().mockImplementation(() => {
    return React.createElement('MapView');
  });
  
  MapView.Marker = jest.fn().mockImplementation(() => {
    return React.createElement('Marker');
  });
  
  return {
    __esModule: true,
    default: MapView,
  };
});
