import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UnreadMessage {
  conversation_id: string;
  count: number;
  sender_name: string;
  listing_title: string;
}

export const useUnreadMessages = (userId: string | undefined) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    // Fonction pour récupérer le nombre de messages non lus
    const fetchUnreadCount = async () => {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

      if (!conversations) return;

      const conversationIds = conversations.map(c => c.id);
      
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .eq('receiver_id', userId)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    // Écouter les nouveaux messages en temps réel
    const channel = supabase
      .channel('new-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Incrémenter le compteur
          setUnreadCount(prev => prev + 1);

          // Récupérer les infos pour la notification
          const { data: conversation } = await supabase
            .from('conversations')
            .select(`
              *,
              listing:listing_id(title),
              buyer:profiles!conversations_buyer_id_fkey(full_name),
              seller:profiles!conversations_seller_id_fkey(full_name)
            `)
            .eq('id', newMessage.conversation_id)
            .single();

          if (conversation) {
            const senderName = conversation.buyer_id === newMessage.sender_id 
              ? conversation.buyer?.full_name 
              : conversation.seller?.full_name;

            // Afficher une notification toast
            if (newMessage.message_type === 'text') {
              toast({
                title: `Nouveau message de ${senderName}`,
                description: newMessage.content.length > 50 
                  ? newMessage.content.substring(0, 50) + '...' 
                  : newMessage.content,
              });
            } else if (newMessage.message_type === 'image') {
              toast({
                title: `${senderName} a partagé une image`,
                description: conversation.listing?.title,
              });
            } else if (newMessage.message_type === 'location') {
              toast({
                title: `${senderName} a partagé une position`,
                description: newMessage.location_name || 'Position partagée',
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('[useUnreadMessages] UPDATE event received:', {
            old: payload.old,
            new: payload.new
          });
          
          const oldMessage = payload.old as any;
          const newMessage = payload.new as any;
          
          // Si le message passe de non-lu à lu, recharger le compteur complet
          if (oldMessage?.is_read === false && newMessage?.is_read === true) {
            console.log('[useUnreadMessages] Message marked as read, reloading counter...');
            await fetchUnreadCount();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'price_offers',
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          const offer = payload.new as any;
          
          // Récupérer les infos de l'offre
          const { data: conversation } = await supabase
            .from('conversations')
            .select(`
              *,
              listing:listing_id(title, price),
              buyer:profiles!conversations_buyer_id_fkey(full_name),
              seller:profiles!conversations_seller_id_fkey(full_name)
            `)
            .eq('id', offer.conversation_id)
            .single();

          if (conversation) {
            const senderName = conversation.buyer_id === offer.sender_id 
              ? conversation.buyer?.full_name 
              : conversation.seller?.full_name;

            toast({
              title: `💰 Nouvelle offre de ${senderName}`,
              description: `${offer.amount.toLocaleString()} FCFA pour ${conversation.listing?.title}`,
            });
          }
        }
      )
      .subscribe();

    // Re-fetch le compteur quand l'utilisateur revient sur la page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, toast]);

  // Fonction pour recharger manuellement le compteur
  const refetchUnreadCount = useCallback(async () => {
    if (!userId) {
      console.log('[refetchUnreadCount] No userId provided');
      return;
    }

    try {
      console.log('[refetchUnreadCount] Fetching unread count for user:', userId);
      
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

      if (convError) {
        console.error('[refetchUnreadCount] Error fetching conversations:', convError);
        return;
      }

      if (!conversations || conversations.length === 0) {
        console.log('[refetchUnreadCount] No conversations found');
        setUnreadCount(0);
        return;
      }

      const conversationIds = conversations.map(c => c.id);
      console.log('[refetchUnreadCount] Found', conversationIds.length, 'conversations');
      
      const { count, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (countError) {
        console.error('[refetchUnreadCount] Error counting unread messages:', countError);
        return;
      }

      console.log('[refetchUnreadCount] Unread messages count:', count || 0);
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('[refetchUnreadCount] Unexpected error:', error);
    }
  }, [userId]);

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!userId) {
      console.log('[markConversationAsRead] No userId provided');
      return;
    }

    console.log('[markConversationAsRead] Marking messages as read for:', {
      conversationId,
      userId
    });

    try {
      // Marquer les messages comme lus
      const { data, error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .eq('is_read', false)
        .select();

      if (error) {
        console.error('[markConversationAsRead] Error:', error);
        throw error;
      }
      
      console.log('[markConversationAsRead] Successfully marked', data?.length || 0, 'messages as read');
      
      // Recharger le compteur complet pour être sûr de la synchronisation
      await refetchUnreadCount();
    } catch (error) {
      console.error('[markConversationAsRead] Failed:', error);
    }
  }, [userId, refetchUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      // Marquer tous les messages non lus comme lus
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      // Réinitialiser immédiatement le compteur à 0
      setUnreadCount(0);
      
      toast({
        title: "Tous les messages ont été marqués comme lus",
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer les messages comme lus",
        variant: "destructive",
      });
    }
  }, [userId, toast]);

  return { unreadCount, markConversationAsRead, markAllAsRead, refetchUnreadCount };
};
