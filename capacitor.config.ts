import type { CapacitorConfig } from '@capacitor/cli';



// Live web shell (like KiDi+): UI/JS updates without a new Play build.
// Local hot-reload: set NATIVE_APP_URL=http://YOUR_LAN_IP:5173 before cap sync.
const nativeAppUrl = process.env.NATIVE_APP_URL || "https://ayokamarket.com";

const config: CapacitorConfig = {
  appId: 'com.ayoka.market',
  appName: 'AYOKA',
  webDir: 'dist',
  server: {
    url: nativeAppUrl,
    cleartext: nativeAppUrl.startsWith("http://"),
    androidScheme: "https",
    allowNavigation: [
      "ayokamarket.com",
      "www.ayokamarket.com",
      "*.lovable.app",
      "*.lovableproject.com",
      "*.stripe.com",
    ],
  },

  backgroundColor: '#FFFFFF',
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      launchFadeOutDuration: 0,
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false
    },
    Camera: {
      android: {
        permissions: ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]
      },
      ios: {
        permissions: [
          "NSCameraUsageDescription: Nous avons besoin d'accéder à votre appareil photo pour prendre des photos de vos articles à vendre",
          "NSPhotoLibraryUsageDescription: Nous avons besoin d'accéder à votre galerie pour sélectionner des photos de vos articles"
        ]
      }
    },
    NativeBiometric: {
      ios: {
        permissions: [
          "NSFaceIDUsageDescription: Utilisez Face ID pour vous authentifier rapidement et en toute sécurité"
        ]
      }
    },
    Geolocation: {
      android: {
        permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]
      },
      ios: {
        permissions: [
          "NSLocationWhenInUseUsageDescription: Nous utilisons votre position pour estimer la distance avec les annonceurs et améliorer vos résultats de recherche"
        ]
      }
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    FirebaseMessaging: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true,
    }
  },
  ios: {
    // iOS specific configuration
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: true,
    // Push notification configuration
    // Note: APNs requires proper certificates and provisioning profiles
    // configured in Xcode and Apple Developer Portal
  },
  android: {
    // Android specific configuration
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    useLegacyBridge: false,
    overrideUserAgent: undefined,
    backgroundColor: '#FFFFFF'
  }
};

export default config;
