import { useState, useEffect } from 'react';
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
          const updatedMessage = payload.new as any;
          
          // Si le message a été marqué comme lu, décrémenter le compteur
          if (updatedMessage.is_read === true) {
            setUnreadCount(prev => Math.max(0, prev - 1));
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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as any;
          
          // Si le message a été lu, décrémenter le compteur
          if (updatedMessage.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, toast]);

  const markConversationAsRead = async (conversationId: string) => {
    if (!userId) return;

    const { data: unreadMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (unreadMessages && unreadMessages.length > 0) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .eq('is_read', false);
    }
  };

  return { unreadCount, markConversationAsRead };
};
