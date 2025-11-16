import { useEffect } from 'react';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePushNotifications = (userId: string | undefined) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId || !Capacitor.isNativePlatform()) return;

    const initPushNotifications = async () => {
      try {
        // Request permission
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.log('Push notification permission denied');
          return;
        }

        // Register for push notifications
        await PushNotifications.register();

        // Listen for registration
        await PushNotifications.addListener('registration', async (token: Token) => {
          console.log('Push registration success, token: ' + token.value);
          
          // Save token to user profile
          await supabase
            .from('profiles')
            .update({ push_token: token.value })
            .eq('id', userId);
        });

        // Listen for registration errors
        await PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });

        // Listen for push notifications received
        await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification: PushNotificationSchema) => {
            console.log('Push received: ' + JSON.stringify(notification));
            toast(notification.title || 'Nouvelle notification', {
              description: notification.body,
            });
          }
        );

        // Listen for notification action performed
        await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (notification: ActionPerformed) => {
            console.log('Push action performed: ' + JSON.stringify(notification));
            
            const data = notification.notification.data;
            
            // Navigate based on notification type
            if (data.type === 'message' && data.conversationId) {
              navigate(`/messages?conversation=${data.conversationId}`);
            } else if (data.type === 'favorite' && data.listingId) {
              navigate(`/listing/${data.listingId}`);
            }
          }
        );

      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    initPushNotifications();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [userId, navigate]);
};
