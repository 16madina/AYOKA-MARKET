import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Star, Shield, TrendingUp, Users, ArrowLeft, Package } from "lucide-react";
import { FollowButton } from "@/components/profile/FollowButton";
import { ReviewCard } from "@/components/profile/ReviewCard";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";

const SellerPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["seller-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: listings } = useQuery({
    queryKey: ["seller-listings", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          categories(name, icon)
        `)
        .eq("user_id", id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["seller-reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url),
          listing:listings(title)
        `)
        .eq("reviewee_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!profile) return null;

  const initials = profile.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="min-h-screen pb-20 bg-muted/30">
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Profil du vendeur</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Seller Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold text-2xl">{profile.full_name || "Utilisateur"}</h2>
                  {profile.email_verified && (
                    <Badge variant="default" className="flex items-center gap-1 bg-green-600 hover:bg-green-700">
                      <Shield className="h-3 w-3" />
                      Vérifié
                    </Badge>
                  )}
                </div>
                {(profile.city || profile.country) && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {profile.rating_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-lg">{profile.rating_average?.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({profile.rating_count} avis)</span>
                  </div>
                )}
              </div>
              {currentUser && currentUser.id !== id && (
                <FollowButton userId={id!} currentUserId={currentUser.id} />
              )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Ventes</span>
                </div>
                <p className="font-bold text-xl">{profile.total_sales || 0}</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Abonnés</span>
                </div>
                <p className="font-bold text-xl">{profile.followers_count || 0}</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Package className="h-4 w-4" />
                  <span className="text-xs">Annonces</span>
                </div>
                <p className="font-bold text-xl">{listings?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="listings">
              Annonces ({listings?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="reviews">
              Avis ({reviews?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4 mt-4">
            {listings && listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {listings.map((listing: any) => (
                  <Card
                    key={listing.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => navigate(`/listing/${listing.id}`)}
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {listing.images?.[0] ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          Pas d'image
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                        {listing.categories?.name}
                      </p>
                      <p className="text-xl font-bold text-primary">
                        {listing.price.toLocaleString()} FCFA
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {listing.location}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Aucune annonce active
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4 mt-4">
            {reviews && reviews.length > 0 ? (
              reviews.map((review: any) => (
                <ReviewCard key={review.id} review={review} />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Aucun avis pour le moment
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default SellerPublicProfile;
