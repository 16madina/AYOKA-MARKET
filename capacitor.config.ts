import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.fdde6a57c0ea45b0bd6d4e42d3d22471',
  appName: 'Revivo',
  webDir: 'dist',
  server: {
    url: 'https://fdde6a57-c0ea-45b0-bd6d-4e42d3d22471.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    Camera: {
      android: {
        permissions: ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]
      },
      ios: {
        permissions: ["NSCameraUsageDescription", "NSPhotoLibraryUsageDescription"]
      }
    }
  }
};

export default config;
