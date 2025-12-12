import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

    const initializePushNotifications = async () => {
      try {
        // Attendre qu'un utilisateur soit connecté avant d'initialiser
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user logged in, waiting for auth before requesting push permissions');
          return;
        }

        console.log('User logged in, initializing push notifications for:', user.email);

        // Vérifier le statut actuel des permissions
        const permStatus = await FirebaseMessaging.checkPermissions();
        console.log('Current permission status:', permStatus.receive);
        
        if (permStatus.receive === 'denied') {
          setPermissionStatus('denied');
          return;
        }

        if (permStatus.receive === 'prompt') {
          console.log('Requesting notification permissions...');
          // Demander la permission pour les notifications
          const permission = await FirebaseMessaging.requestPermissions();
          console.log('Permission result:', permission.receive);
          
          if (permission.receive !== 'granted') {
            setPermissionStatus('denied');
            return;
          }
        }

        setPermissionStatus('granted');

        // Écouter les changements de token FCM
        await FirebaseMessaging.addListener('tokenReceived', async (event) => {
          console.log(`FCM Token received (${platform}):`, event.token);
          setPushToken(event.token);
          setIsRegistered(true);
          
          // Sauvegarder le token FCM dans la base de données
          await saveTokenToDatabase(event.token);
        });

        // Écouter les notifications reçues (foreground)
        await FirebaseMessaging.addListener('notificationReceived', (event) => {
          console.log('Push notification received (foreground):', event.notification);
          
          const notification = event.notification;
          toast({
            title: notification.title || 'Nouvelle notification',
            description: notification.body,
          });
        });

        // Écouter les actions sur les notifications (background/killed)
        await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
          console.log('Push notification action performed:', event);
          
          // Gérer la navigation en fonction de la notification
          const data = event.notification.data as Record<string, string>;
          if (data?.route) {
            window.location.href = data.route;
          } else if (data?.type) {
            // Navigation basée sur le type de notification
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

        // Obtenir le token FCM (ceci déclenche automatiquement la conversion APNs -> FCM sur iOS)
        console.log('Getting FCM token...');
        const tokenResult = await FirebaseMessaging.getToken();
        console.log(`FCM Token obtained (${platform}):`, tokenResult.token);
        setPushToken(tokenResult.token);
        setIsRegistered(true);
        await saveTokenToDatabase(tokenResult.token);

      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    // Écouter les changements d'auth pour initialiser les notifications après connexion
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, initializing push notifications');
        initializePushNotifications();
      }
    });

    // Aussi essayer d'initialiser immédiatement si déjà connecté
    initializePushNotifications();

    // Cleanup
    return () => {
      subscription.unsubscribe();
      FirebaseMessaging.removeAllListeners();
    };
  }, [isNative, platform, saveTokenToDatabase]);

  const unregisterNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Supprimer le token de la base de données
        await supabase
          .from('profiles')
          .update({ push_token: null })
          .eq('id', user.id);
      }

      // Supprimer le token FCM
      await FirebaseMessaging.deleteToken();
      await FirebaseMessaging.removeAllListeners();
      setIsRegistered(false);
      setPushToken(null);
    } catch (error) {
      console.error('Error unregistering notifications:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isNative) return false;

    try {
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
      console.error('Error requesting permission:', error);
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
