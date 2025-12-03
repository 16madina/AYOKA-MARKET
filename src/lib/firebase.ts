// Firebase configuration for AYOKA MARKET
// This file provides Firebase configuration for web/PWA usage
// For native mobile apps, Firebase is configured via google-services.json (Android) 
// and GoogleService-Info.plist (iOS)

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD74HwegtTuQIptKgc0Tzd6MEuyUiZnSwE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bazaram-321cc.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bazaram-321cc",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bazaram-321cc.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "410120109044",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:410120109044:android:94855d1989c4110025d7a1"
};

// Note: For push notifications in Capacitor/native apps, 
// Firebase is initialized automatically via the native SDKs
// This configuration is mainly for web Firebase features if needed
