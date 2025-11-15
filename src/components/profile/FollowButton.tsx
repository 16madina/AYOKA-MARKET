import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";

interface FollowButtonProps {
  userId: string;
  currentUserId: string | undefined;
}

export const FollowButton = ({ userId, currentUserId }: FollowButtonProps) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Check if current user follows this user
  const { data: isFollowing } = useQuery({
    queryKey: ["is-following", currentUserId, userId],
    queryFn: async () => {
      if (!currentUserId) return false;
      const { data, error } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("followed_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
    enabled: !!currentUserId && currentUserId !== userId,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("followers")
        .insert({ follower_id: currentUserId, followed_id: userId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-following"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Vous suivez maintenant ce vendeur");
    },
    onError: () => {
      toast.error("Erreur lors du suivi");
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("followed_id", userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-following"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Vous ne suivez plus ce vendeur");
    },
    onError: () => {
      toast.error("Erreur lors du désabonnement");
    },
  });

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollowMutation.mutateAsync();
      } else {
        await followMutation.mutateAsync();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUserId || currentUserId === userId) {
    return null;
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      className="gap-2"
    >
      {isFollowing ? (
        <>
          <UserMinus className="h-4 w-4" />
          Ne plus suivre
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Suivre
        </>
      )}
    </Button>
  );
};
