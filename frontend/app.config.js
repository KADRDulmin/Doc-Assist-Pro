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
  platforms: ["ios", "android", "web"],  notification: {
    icon: "./assets/images/notification-icon.png",
    color: "#ffffff",
    androidMode: "default",
    androidCollapsedTitle: "DocAssistPro",
    iosDisplayInForeground: true,
    androidBehavior: {
      shouldShowBanner: true,
      shouldShowList: true,
      priority: "high",
    }
  },
  ios: {
    supportsTablet: true,
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_IOS_GOOGLE_MAPS_API_KEY || "AIzaSyCOZ2LqiS0C3fxrtMujZQU8O-_o02Tvgnc"
    },
    infoPlist: {
      UIBackgroundModes: ["location", "fetch", "remote-notification"]
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_ANDROID_GOOGLE_MAPS_API_KEY || "AIzaSyCOZ2LqiS0C3fxrtMujZQU8O-_o02Tvgnc"
      }
    },
    package: "com.docassistpro.app",
    permissions: [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "RECEIVE_BOOT_COMPLETED",
      "NOTIFICATIONS",
      "SCHEDULE_EXACT_ALARM",
      "USE_EXACT_ALARM",
      "VIBRATE",
      "POST_NOTIFICATIONS"
    ]
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_WEB_GOOGLE_MAPS_API_KEY || "YOUR_WEB_API_KEY_HERE"
    }
  },
  plugins: [
    "expo-router",
    "expo-dev-client",    ["expo-notifications", {
      icon: "./assets/images/notification-icon.png",
      color: "#ffffff",
      sounds: ["./assets/sounds/notification.wav"],
      androidMode: "default",
      androidCollapsedTitle: "DocAssistPro",
      iosDisplayInForeground: true
    }],
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
    "@react-native-community/datetimepicker"
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    apiUrl: getApiUrl(),
    isProduction: process.env.NODE_ENV === 'production',
    EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
    EXPO_PUBLIC_GEMINI_MODEL: process.env.EXPO_PUBLIC_GEMINI_MODEL,
    eas: {
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID || "your-project-id"
    }
  }
};
