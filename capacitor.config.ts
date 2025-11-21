import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.djassa.market',
  appName: 'DJASSA',
  webDir: 'dist',
  backgroundColor: '#FFFFFF',
  server: {
    // URL de développement uniquement - désactiver en production
    // url: 'https://fdde6a57-c0ea-45b0-bd6d-4e42d3d22471.lovableproject.com?forceHideBadge=true',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      showSpinner: false
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
    }
  }
};

export default config;
