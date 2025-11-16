import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export const useFavoriteNotifications = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('favorite-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=neq.${userId}` // Don't notify for own favorites
        },
        async (payload: any) => {
          // Get listing details
          const { data: listing } = await supabase
            .from('listings')
            .select('id, title, user_id')
            .eq('id', payload.new.listing_id)
            .single();

          // Only notify the listing owner
          if (listing?.user_id === userId) {
            // Show local notification
            toast("Nouveau favori", {
              description: `Quelqu'un a ajouté "${listing.title}" à ses favoris`,
              action: {
                label: "Voir",
                onClick: () => window.location.href = `/listing/${listing.id}`
              }
            });

            // Send push notification on native platforms
            if (Capacitor.isNativePlatform()) {
              await PushNotifications.schedule({
                notifications: [{
                  title: "Nouveau favori",
                  body: `Quelqu'un a ajouté "${listing.title}" à ses favoris`,
                  id: Date.now(),
                  extra: {
                    type: 'favorite',
                    listingId: listing.id
                  }
                }]
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
};
