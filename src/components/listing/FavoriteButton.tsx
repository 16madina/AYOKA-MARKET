import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface FavoriteButtonProps {
  listingId: string;
}

export const FavoriteButton = ({ listingId }: FavoriteButtonProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthChecked(true);
      return user;
    },
  });

  const { data: favorite, isLoading } = useQuery({
    queryKey: ["favorite", listingId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("listing_id", listingId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isAuthChecked && !!user,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Non authentifié");
      }

      if (favorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("id", favorite.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ listing_id: listingId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite", listingId, user?.id] });
      toast({
        title: favorite ? "Retiré des favoris" : "Ajouté aux favoris",
        description: favorite
          ? "L'annonce a été retirée de vos favoris"
          : "L'annonce a été ajoutée à vos favoris",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message === "Non authentifié"
          ? "Vous devez être connecté pour ajouter aux favoris"
          : "Impossible de modifier les favoris",
        variant: "destructive",
      });
    },
  });

  if (!isAuthChecked || isLoading) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Heart className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => toggleFavorite.mutate()}
      disabled={toggleFavorite.isPending}
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          favorite ? "fill-primary text-primary" : ""
        }`}
      />
    </Button>
  );
};
