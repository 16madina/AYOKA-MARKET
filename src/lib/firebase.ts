// Firebase configuration for AYOKA MARKET
// This file provides Firebase configuration for web/PWA usage
// For native mobile apps, Firebase is configured via google-services.json (Android) 
// and GoogleService-Info.plist (iOS)

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCDYHY9hcv_45bkzs4d6qe7PklCb1vV-48",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ayoka-market.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ayoka-market",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ayoka-market.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "198878757338",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:198878757338:android:92852e251472f7acd3c0e3"
};

// Note: For push notifications in Capacitor/native apps, 
// Firebase is initialized automatically via the native SDKs
// This configuration is mainly for web Firebase features if needed
