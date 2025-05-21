// Import and extend with jest-native
import '@testing-library/jest-native/extend-expect';

// Mock expo modules using our custom mock files
jest.mock('expo-router');
jest.mock('expo-linear-gradient');
jest.mock('@expo/vector-icons', () => {
  const icons = jest.requireActual('d:/Raminda/NSBM/3rd yr/Computing individual project/Doc-Assist-Pro/Doc-Assist-Pro/frontend/__mocks__/expo-vector-icons.js');
  return icons;
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('@react-native-masked-view/masked-view', () => 'MaskedView');

// Mock all expo modules
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: {
      latitude: 37.78825,
      longitude: -122.4324,
    }
  })),
  watchPositionAsync: jest.fn(() => ({
    remove: jest.fn()
  })),
}));

jest.mock('expo-constants', () => ({
  default: { 
    manifest: {
      extra: {
        apiUrl: 'https://test-api.example.com',
      }
    }
  },
  Constants: {
    manifest: {
      extra: {
        apiUrl: 'https://test-api.example.com',
      }
    }
  }
}));

// Mock Expo module
jest.mock('expo', () => ({
  Expo: {
    registerRootComponent: jest.fn(),
  },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const iconMock = jest.fn().mockImplementation(() => 'Icon');
  return {
    Ionicons: iconMock,
    Feather: iconMock,
    FontAwesome5: iconMock,
    MaterialIcons: iconMock,
    MaterialCommunityIcons: iconMock,
    AntDesign: iconMock,
    Entypo: iconMock,
    EvilIcons: iconMock,
    Octicons: iconMock,
  };
});

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  dismissAllNotificationsAsync: jest.fn(),
  getBadgeCountAsync: jest.fn(() => Promise.resolve(0)),
  setBadgeCountAsync: jest.fn(() => Promise.resolve(true)),
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: 'SafeAreaView',
}));

// Create a comprehensive mock for React Native's Animated API
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Mock Dimensions
  RN.Dimensions.get = jest.fn().mockReturnValue({
    width: 375,
    height: 812,
    scale: 1,
    fontScale: 1,
  });
  
  // Create a complete mock for the Animated API
  const AnimatedMock = {
    Value: jest.fn().mockImplementation((value) => ({
      _value: value,
      setValue: jest.fn(),
      setOffset: jest.fn(),
      flattenOffset: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      stopAnimation: jest.fn(),
      resetAnimation: jest.fn(),
      interpolate: jest.fn().mockReturnValue({
        __getValue: jest.fn(() => 0),
        interpolate: jest.fn(),
      }),
      __getValue: jest.fn(() => 0),
      __attach: jest.fn(),
      __detach: jest.fn(),
      __getAnimatedValue: jest.fn(() => 0),
      __addChild: jest.fn(),
      __removeChild: jest.fn(),
      __getChildren: jest.fn(() => []),
    })),
    timing: jest.fn().mockReturnValue({
      start: jest.fn((callback) => callback && callback({ finished: true })),
      stop: jest.fn(),
      reset: jest.fn(),
    }),
    spring: jest.fn().mockReturnValue({
      start: jest.fn((callback) => callback && callback({ finished: true })),
      stop: jest.fn(),
      reset: jest.fn(),
    }),
    decay: jest.fn().mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    }),
    sequence: jest.fn().mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    }),
    parallel: jest.fn().mockReturnValue({
      start: jest.fn((callback) => callback && callback({ finished: true })),
      stop: jest.fn(),
    }),
    stagger: jest.fn().mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    }),
    loop: jest.fn().mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    }),
    createAnimatedComponent: jest.fn((Component) => Component),
    View: 'AnimatedView',
    Text: 'AnimatedText',
    Image: 'AnimatedImage',
    ScrollView: RN.ScrollView,
    FlatList: RN.FlatList,
    event: jest.fn(() => jest.fn()),
  };
  
  RN.Animated = AnimatedMock;
  
  return RN;
});

// Mock Animated
jest.mock('react-native', () => {
  const reactNative = jest.requireActual('react-native');
  reactNative.Animated.timing = () => ({
    start: (callback) => {
      if (callback) callback();
    },
  });
  return reactNative;
});

// Setup for various context providers
global.mockAuthContext = {
  user: {
    id: 1,
    email: 'patient@example.com',
    first_name: 'Test',
    last_name: 'Patient',
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  verifyEmail: jest.fn(),
  loading: false,
  error: null,
};
