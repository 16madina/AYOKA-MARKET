import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { NotificationType } from '@/types/notifications';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';
const isSupported = isBrowser && 'serviceWorker' in navigator && 'PushManager' in window;

export const useWebPushNotifications = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check current permission status
  const checkPermission = useCallback(() => {
    if (!isBrowser || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.log('Push notifications not supported in this browser');
      return false;
    }

    try {
      setIsLoading(true);
      const permission = await Notification.requestPermission();
      setIsPermissionGranted(permission === 'granted');
      
      if (permission === 'granted') {
        await registerServiceWorker();
        return true;
      } else if (permission === 'denied') {
        toast({
          title: 'Notifications désactivées',
          description: 'Vous pouvez les activer dans les paramètres de votre navigateur',
          variant: 'destructive'
        });
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!isSupported) return null;

    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);
      
      // Get FCM token after service worker is ready
      const token = await getTokenFromServiceWorker(registration);
      if (token) {
        setFcmToken(token);
        await saveTokenToDatabase(token);
      }
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }, []);

  // Get FCM token from service worker
  const getTokenFromServiceWorker = async (registration: ServiceWorkerRegistration): Promise<string | null> => {
    try {
      // For web push, we use the VAPID key approach
      // This is a simplified version - in production you'd use Firebase SDK
      const vapidKey = urlBase64ToUint8Array(
        // This should be your VAPID public key from Firebase Console
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
      );
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey as BufferSource
      });
      
      // Convert subscription to a token-like string
      const token = btoa(JSON.stringify(subscription.toJSON()));
      return token;
    } catch (error) {
      console.error('Error getting push subscription:', error);
      return null;
    }
  };

  // Save token to database
  const saveTokenToDatabase = async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving push token:', error);
      } else {
        console.log('Push token saved successfully');
      }
    } catch (error) {
      console.error('Error saving token to database:', error);
    }
  };

  // Remove token from database
  const removeToken = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ push_token: null })
        .eq('id', user.id);

      setFcmToken(null);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }, []);

  // Show local notification (for foreground messages)
  const showLocalNotification = useCallback((
    title: string,
    body: string,
    type: NotificationType = 'system',
    data?: Record<string, string>
  ) => {
    if (!isPermissionGranted) return;

    try {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `ayoka-${type}`,
        data
      });
    } catch (error) {
      // Fallback to toast for browsers that don't support Notification constructor
      toast({
        title,
        description: body
      });
    }
  }, [isPermissionGranted]);

  // Initialize on mount
  useEffect(() => {
    if (!isSupported) return;

    const permission = checkPermission();
    setIsPermissionGranted(permission === 'granted');

    if (permission === 'granted') {
      registerServiceWorker();
    }

    // Listen for messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        console.log('Notification clicked:', event.data.data);
        // Handle navigation based on notification data
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [checkPermission, registerServiceWorker]);

  return {
    fcmToken,
    isPermissionGranted,
    isLoading,
    isSupported,
    requestPermission,
    removeToken,
    showLocalNotification,
    checkPermission
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
