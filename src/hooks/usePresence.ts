import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePresence = (userId: string | undefined) => {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!userId) return;

    const updateOnlineStatus = async (isOnline: boolean) => {
      await supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString(),
        })
        .eq('id', userId);
    };

    // Set online on mount
    updateOnlineStatus(true);

    // Update every 30 seconds
    intervalRef.current = setInterval(() => {
      updateOnlineStatus(true);
    }, 30000);

    // Set offline on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      updateOnlineStatus(false);
    };
  }, [userId]);
};
