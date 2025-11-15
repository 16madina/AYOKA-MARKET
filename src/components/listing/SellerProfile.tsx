import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Package, Star, Shield, TrendingUp, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { FollowButton } from "@/components/profile/FollowButton";
import { useState, useEffect } from "react";

interface SellerProfileProps {
  userId: string;
}

export const SellerProfile = ({ userId }: SellerProfileProps) => {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: listings } = useQuery({
    queryKey: ["user-listings", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  if (!profile) return null;

  const initials = profile.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatar_url || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{profile.full_name || "Utilisateur"}</h3>
              {profile.verified_seller && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Vérifié
                </Badge>
              )}
            </div>
            {profile.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.rating_count > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-sm">{profile.rating_average.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({profile.rating_count} avis)</span>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Ventes</p>
              <p className="font-semibold">{profile.total_sales || 0}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Abonnés</p>
              <p className="font-semibold">{profile.followers_count || 0}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Membre</p>
              <p className="font-semibold text-sm">
                {profile.created_at
                  ? formatDistanceToNow(new Date(profile.created_at), { locale: fr })
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Follow Button */}
        {currentUser && currentUser.id !== userId && (
          <div className="pt-2">
            <FollowButton userId={userId} currentUserId={currentUser?.id} />
          </div>
        )}

        {listings && listings.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4" />
              <span>Autres annonces du vendeur</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  to={`/listing/${listing.id}`}
                  className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                >
                  {listing.images?.[0] ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      Pas d'image
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
