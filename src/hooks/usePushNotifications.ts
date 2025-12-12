import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Dynamically import FirebaseMessaging only on native platforms
let FirebaseMessaging: any = null;

export const usePushNotifications = () => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  const saveTokenToDatabase = useCallback(async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in, cannot save push token');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving push token:', error);
      } else {
        console.log('Push token (FCM) saved successfully to database');
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }, []);

  useEffect(() => {
    if (!isNative) {
      console.log('Push notifications only available on native platforms');
      return;
    }

    let unsubscribeAuth: (() => void) | null = null;

    const initializePushNotifications = async () => {
      try {
        // Dynamically import FirebaseMessaging
        if (!FirebaseMessaging) {
          const module = await import('@capacitor-firebase/messaging');
          FirebaseMessaging = module.FirebaseMessaging;
        }

        // Wait for user to be logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user logged in, waiting for auth before requesting push permissions');
          return;
        }

        console.log('User logged in, initializing FCM push notifications for:', user.email);

        // Check current permission status
        const permStatus = await FirebaseMessaging.checkPermissions();
        console.log('FCM permission status:', permStatus.receive);
        
        if (permStatus.receive === 'denied') {
          setPermissionStatus('denied');
          return;
        }

        if (permStatus.receive === 'prompt') {
          console.log('Requesting FCM notification permissions...');
          const permission = await FirebaseMessaging.requestPermissions();
          console.log('FCM permission result:', permission.receive);
          
          if (permission.receive !== 'granted') {
            setPermissionStatus('denied');
            return;
          }
        }

        setPermissionStatus('granted');

        // Listen for FCM token changes
        await FirebaseMessaging.addListener('tokenReceived', async (event: { token: string }) => {
          console.log(`FCM Token received (${platform}):`, event.token);
          setPushToken(event.token);
          setIsRegistered(true);
          await saveTokenToDatabase(event.token);
        });

        // Listen for foreground notifications
        await FirebaseMessaging.addListener('notificationReceived', (event: { notification: { title?: string; body?: string } }) => {
          console.log('FCM notification received (foreground):', event.notification);
          
          const notification = event.notification;
          toast({
            title: notification.title || 'Nouvelle notification',
            description: notification.body,
          });
        });

        // Listen for notification actions (background/killed)
        await FirebaseMessaging.addListener('notificationActionPerformed', (event: { notification: { data?: Record<string, string> } }) => {
          console.log('FCM notification action performed:', event);
          
          const data = event.notification.data;
          if (data?.route) {
            window.location.href = data.route;
          } else if (data?.type) {
            switch (data.type) {
              case 'message':
                window.location.href = data.conversationId 
                  ? `/messages?conversation=${data.conversationId}` 
                  : '/messages';
                break;
              case 'offer':
              case 'listing':
              case 'like':
              case 'new_listing':
                if (data.listingId || data.listing_id) {
                  window.location.href = `/listing/${data.listingId || data.listing_id}`;
                }
                break;
              case 'payment':
                window.location.href = '/transactions';
                break;
              case 'follower':
                window.location.href = data.userId 
                  ? `/seller/${data.userId}` 
                  : '/profile';
                break;
              default:
                break;
            }
          }
        });

        // Get FCM token (this automatically handles APNs -> FCM conversion on iOS)
        console.log('Getting FCM token...');
        const tokenResult = await FirebaseMessaging.getToken();
        console.log(`FCM Token obtained (${platform}):`, tokenResult.token);
        setPushToken(tokenResult.token);
        setIsRegistered(true);
        await saveTokenToDatabase(tokenResult.token);

      } catch (error) {
        console.error('Error initializing FCM push notifications:', error);
      }
    };

    // Listen for auth changes to initialize notifications after login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, initializing FCM push notifications');
        initializePushNotifications();
      }
    });
    unsubscribeAuth = () => subscription.unsubscribe();

    // Also try to initialize immediately if already logged in
    initializePushNotifications();

    // Cleanup
    return () => {
      unsubscribeAuth?.();
      if (FirebaseMessaging) {
        FirebaseMessaging.removeAllListeners();
      }
    };
  }, [isNative, platform, saveTokenToDatabase]);

  const unregisterNotifications = async () => {
    try {
      if (!FirebaseMessaging) {
        const module = await import('@capacitor-firebase/messaging');
        FirebaseMessaging = module.FirebaseMessaging;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ push_token: null })
          .eq('id', user.id);
      }

      await FirebaseMessaging.deleteToken();
      await FirebaseMessaging.removeAllListeners();
      setIsRegistered(false);
      setPushToken(null);
    } catch (error) {
      console.error('Error unregistering FCM notifications:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isNative) return false;

    try {
      if (!FirebaseMessaging) {
        const module = await import('@capacitor-firebase/messaging');
        FirebaseMessaging = module.FirebaseMessaging;
      }

      const permission = await FirebaseMessaging.requestPermissions();
      const granted = permission.receive === 'granted';
      setPermissionStatus(granted ? 'granted' : 'denied');
      
      if (granted && !isRegistered) {
        const tokenResult = await FirebaseMessaging.getToken();
        console.log(`FCM Token obtained after permission (${platform}):`, tokenResult.token);
        setPushToken(tokenResult.token);
        setIsRegistered(true);
        await saveTokenToDatabase(tokenResult.token);
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting FCM permission:', error);
      return false;
    }
  };

  return {
    pushToken,
    isRegistered,
    permissionStatus,
    platform,
    isNative,
    unregisterNotifications,
    requestPermission,
  };
};
