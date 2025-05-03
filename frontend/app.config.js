const getApiUrl = () => {
  // Use environment variable if available (for container environments)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Default development API URL
  return 'http://localhost:3000';
};

export default {
  name: "DocAssistPro",
  slug: "DocAssistPro",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_IOS_GOOGLE_MAPS_API_KEY || "AIzaSyCOZ2LqiS0C3fxrtMujZQU8O-_o02Tvgnc"
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_ANDROID_GOOGLE_MAPS_API_KEY || "YOUR_ANDROID_API_KEY_HERE"
      }
    },
    package: "com.docassistpro.app"
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png"
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        "image": "./assets/images/splash-icon.png",
        "imageWidth": 200,
        "resizeMode": "contain",
        "backgroundColor": "#ffffff"
      }
    ],
    [
      "expo-location",
      {
        "locationAlwaysAndWhenInUsePermission": "Allow DocAssistPro to use your location."
      }
    ],
    "react-native-maps"
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    apiUrl: getApiUrl(),
    isProduction: process.env.NODE_ENV === 'production',
    eas: {
      projectId: "your-project-id"
    }
  }
};
