import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseTypingIndicatorProps {
  conversationId: string;
  userId: string;
  onOtherUserTyping: (isTyping: boolean) => void;
}

export const useTypingIndicator = ({ 
  conversationId, 
  userId,
  onOtherUserTyping 
}: UseTypingIndicatorProps) => {
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Fonction pour indiquer qu'on est en train de taper
  const setTyping = useCallback(async () => {
    try {
      await supabase
        .from('profiles')
        .update({ typing_in_conversation: conversationId })
        .eq('id', userId);
    } catch (error) {
      console.error('Error setting typing status:', error);
    }
  }, [conversationId, userId]);

  // Fonction pour indiquer qu'on a arrêté de taper
  const clearTyping = useCallback(async () => {
    try {
      await supabase
        .from('profiles')
        .update({ typing_in_conversation: null })
        .eq('id', userId);
    } catch (error) {
      console.error('Error clearing typing status:', error);
    }
  }, [userId]);

  // Fonction appelée quand l'utilisateur tape
  const handleTyping = useCallback(() => {
    // Indiquer qu'on est en train de taper
    setTyping();

    // Annuler le timeout précédent
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Arrêter l'indicateur après 3 secondes d'inactivité
    typingTimeoutRef.current = setTimeout(() => {
      clearTyping();
    }, 3000);
  }, [setTyping, clearTyping]);

  // Nettoyer l'état de saisie quand on quitte la conversation
  useEffect(() => {
    return () => {
      clearTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [clearTyping]);

  // Écouter les changements de l'autre utilisateur
  useEffect(() => {
    // Récupérer d'abord la conversation pour savoir qui est l'autre utilisateur
    const fetchConversation = async () => {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('buyer_id, seller_id')
        .eq('id', conversationId)
        .single();

      if (!conversation) return;

      const otherUserId = conversation.buyer_id === userId 
        ? conversation.seller_id 
        : conversation.buyer_id;

      // S'abonner aux changements du profil de l'autre utilisateur
      const channel = supabase
        .channel(`typing-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${otherUserId}`,
          },
          (payload) => {
            const newProfile = payload.new as any;
            const isTypingInThisConversation = 
              newProfile.typing_in_conversation === conversationId;
            
            console.log('[TypingIndicator] Other user typing:', isTypingInThisConversation);
            onOtherUserTyping(isTypingInThisConversation);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    fetchConversation();
  }, [conversationId, userId, onOtherUserTyping]);

  return { handleTyping, clearTyping };
};
