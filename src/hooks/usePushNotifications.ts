import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Dynamically import FirebaseMessaging only on native platforms
let FirebaseMessaging: any = null;

// Store pending navigation from notification tap (before app is fully loaded)
let pendingNotificationRoute: string | null = null;

export const getPendingNotificationRoute = () => {
  const route = pendingNotificationRoute;
  pendingNotificationRoute = null; // Clear after reading
  return route;
};

const getRouteFromNotificationData = (data: Record<string, string> | undefined): string | null => {
  if (!data) return null;
  
  if (data.route) {
    return data.route;
  }
  
  switch (data.type) {
    case 'message':
      return data.conversationId 
        ? `/messages?conversation=${data.conversationId}` 
        : '/messages';
    case 'offer':
    case 'listing':
    case 'like':
    case 'new_listing':
      if (data.listingId || data.listing_id) {
        return `/listing/${data.listingId || data.listing_id}`;
      }
      break;
    case 'payment':
      return '/transactions';
    case 'follower':
      return data.userId 
        ? `/seller/${data.userId}` 
        : '/profile';
    case 'review':
      return '/profile';
  }
  
  return null;
};

// Track if already initialized to prevent duplicate listeners
let isInitialized = false;

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
        console.log('❌ No user logged in, cannot save push token');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Error saving push token:', error);
      } else {
        console.log('✅ FCM push token saved successfully to database');
      }
    } catch (error) {
      console.error('❌ Error saving push token:', error);
    }
  }, []);

  useEffect(() => {
    if (!isNative) {
      console.log('📱 Push notifications only available on native platforms');
      return;
    }

    let unsubscribeAuth: (() => void) | null = null;
    let isMounted = true;

    const initializePushNotifications = async () => {
      // Prevent duplicate initialization
      if (isInitialized) {
        console.log('⏭️ FCM already initialized, skipping...');
        return;
      }

      try {
        console.log('🔄 Loading @capacitor-firebase/messaging module...');
        
        // Dynamically import FirebaseMessaging
        if (!FirebaseMessaging) {
          const module = await import('@capacitor-firebase/messaging');
          FirebaseMessaging = module.FirebaseMessaging;
          console.log('✅ FirebaseMessaging module loaded:', typeof FirebaseMessaging);
        }

        // Wait for user to be logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user logged in, waiting for auth before requesting push permissions');
          return;
        }

        if (!isMounted) return;

        console.log('👤 User logged in, initializing FCM push notifications for:', user.email);

        // Mark as initialized BEFORE adding listeners
        isInitialized = true;

        // Remove any existing listeners first
        await FirebaseMessaging.removeAllListeners();

        // Check current permission status using FirebaseMessaging
        console.log('🔍 Calling FirebaseMessaging.checkPermissions()...');
        const permStatus = await FirebaseMessaging.checkPermissions();
        console.log('📋 FCM permission status:', permStatus.receive);
        if (isMounted) setPermissionStatus(permStatus.receive as 'prompt' | 'granted' | 'denied');
        
        if (permStatus.receive === 'denied') {
          console.log('❌ Notifications denied by user');
          return;
        }

        if (permStatus.receive === 'prompt') {
          console.log('🔔 Requesting FCM notification permissions...');
          const permission = await FirebaseMessaging.requestPermissions();
          console.log('📋 FCM permission result:', permission.receive);
          if (isMounted) setPermissionStatus(permission.receive as 'prompt' | 'granted' | 'denied');
          
          if (permission.receive !== 'granted') {
            return;
          }
        }

        if (isMounted) setPermissionStatus('granted');

        // Listen for FCM token changes
        await FirebaseMessaging.addListener('tokenReceived', async (event: { token: string }) => {
          console.log(`FCM Token received (${platform}):`, event.token);
          if (isMounted) {
            setPushToken(event.token);
            setIsRegistered(true);
          }
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
          console.log('FCM notification action performed:', JSON.stringify(event));
          
          const route = getRouteFromNotificationData(event.notification?.data);
          if (route) {
            console.log('📍 Notification tap - navigating to:', route);
            // Store the route in sessionStorage for App.tsx to handle after full load
            try {
              sessionStorage.setItem('pendingNotificationRoute', route);
            } catch {
              // ignore
            }
            pendingNotificationRoute = route;
            
            // Use a small delay to let the app fully initialize before navigation
            // This prevents infinite loop issues on iOS
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname + window.location.search;
                if (currentPath !== route) {
                  console.log('📍 Delayed navigation to:', route);
                  window.location.href = route;
                }
              }
            }, 500);
          }
        });

        // Check for notification that launched the app (Android cold start)
        try {
          // On Android, check if there's a notification that launched the app
          const launchNotification = await FirebaseMessaging.getDeliveredNotifications();
          console.log('📬 Delivered notifications on launch:', JSON.stringify(launchNotification));
          
          // If there are delivered notifications, check the most recent one for launch data
          if (launchNotification?.notifications?.length > 0) {
            const mostRecent = launchNotification.notifications[0];
            if (mostRecent?.data) {
              const route = getRouteFromNotificationData(mostRecent.data as Record<string, string>);
              if (route) {
                console.log('📍 Found launch notification route:', route);
                pendingNotificationRoute = route;
                try {
                  sessionStorage.setItem('pendingNotificationRoute', route);
                } catch {
                  // ignore
                }
              }
            }
          }
        } catch (e) {
          console.log('Could not check delivered notifications:', e);
        }

        // Get FCM token (this automatically handles APNs -> FCM conversion on iOS)
        console.log('🔑 Getting FCM token via FirebaseMessaging.getToken()...');
        const tokenResult = await FirebaseMessaging.getToken();
        const tokenLength = tokenResult.token?.length || 0;
        console.log(`✅ FCM Token obtained (${platform}), length: ${tokenLength}`);
        console.log(`🔑 Token preview: ${tokenResult.token?.substring(0, 30)}...`);
        
        // FCM tokens are typically ~163 chars, APNs tokens are 64 chars
        if (tokenLength < 100) {
          console.warn('⚠️ Token seems too short - might be APNs token instead of FCM token!');
        }
        
        if (isMounted) {
          setPushToken(tokenResult.token);
          setIsRegistered(true);
        }
        await saveTokenToDatabase(tokenResult.token);

      } catch (error: any) {
        console.error('❌ Error initializing FCM push notifications:', error?.message || error?.code || JSON.stringify(error) || error);
        if (error?.stack) console.error('Stack:', error.stack);
        // Reset initialized flag on error so it can retry
        isInitialized = false;
      }
    };

    // Listen for auth changes to initialize notifications after login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user && !isInitialized) {
        console.log('User signed in, initializing FCM push notifications');
        initializePushNotifications();
      } else if (event === 'SIGNED_OUT') {
        // Reset on sign out so it can reinitialize on next sign in
        isInitialized = false;
      }
    });
    unsubscribeAuth = () => subscription.unsubscribe();

    // Also try to initialize immediately if already logged in
    initializePushNotifications();

    // Cleanup
    return () => {
      isMounted = false;
      unsubscribeAuth?.();
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
