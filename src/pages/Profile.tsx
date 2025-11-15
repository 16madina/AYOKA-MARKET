import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";
import { UserListingCard } from "@/components/profile/UserListingCard";
import { ReviewCard } from "@/components/profile/ReviewCard";
import { toast } from "sonner";
import { LogOut, Edit, Settings, Shield, Bell, Share2, ArrowLeft, Users, Star } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: listings, refetch: refetchListings } = useQuery({
    queryKey: ["user-listings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          categories (name)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: reviews } = useQuery({
    queryKey: ["user-reviews", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewee_id", user.id)
        .order("created_at", { ascending: false });
      
      if (reviewsError) throw reviewsError;
      if (!reviewsData || reviewsData.length === 0) return [];

      // Fetch reviewer profiles
      const reviewerIds = reviewsData.map(r => r.reviewer_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", reviewerIds);
      
      if (profilesError) throw profilesError;

      // Merge data
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      return reviewsData.map(review => ({
        ...review,
        reviewer: profilesMap.get(review.reviewer_id) || { full_name: null, avatar_url: null }
      }));
    },
    enabled: !!user,
  });

  const { data: following } = useQuery({
    queryKey: ["user-following", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: followersData, error: followersError } = await supabase
        .from("followers")
        .select("followed_id")
        .eq("follower_id", user.id);
      
      if (followersError) throw followersError;
      if (!followersData || followersData.length === 0) return [];

      const followedIds = followersData.map(f => f.followed_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, rating_average, rating_count, total_sales")
        .in("id", followedIds);
      
      if (profilesError) throw profilesError;
      return profilesData || [];
    },
    enabled: !!user,
  });

  const activeListings = listings?.filter(l => l.status === "active") || [];
  const soldListings = listings?.filter(l => l.status === "sold") || [];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erreur lors de la déconnexion");
    } else {
      toast.success("Déconnexion réussie");
      navigate("/auth");
    }
  };

  const fullName = profile?.full_name || user?.user_metadata?.full_name || "Utilisateur";
  const avatarUrl = profile?.avatar_url;

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg" />
            <span className="font-bold text-xl">ReVivo</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="p-6 space-y-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-muted-foreground">
                {fullName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold">{fullName}</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>

          <div className="w-full max-w-md space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                Modifier le profil
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white"
            >
              <Shield className="h-4 w-4 mr-2" />
              Panneau d'administration
            </Button>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4 bg-muted/50 p-1 h-12">
            <TabsTrigger 
              value="listings"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-semibold text-xs"
            >
              Annonces ({(activeListings.length + soldListings.length) || 0})
            </TabsTrigger>
            <TabsTrigger 
              value="reviews"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-semibold text-xs"
            >
              Avis ({reviews?.length || 0})
            </TabsTrigger>
            <TabsTrigger 
              value="following"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-semibold text-xs"
            >
              Abonnés ({following?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            {!listings || listings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">Aucune annonce</p>
                <p className="text-sm mt-2">Commencez à publier vos articles !</p>
                <Button 
                  className="mt-4"
                  onClick={() => navigate("/publish")}
                >
                  Publier une annonce
                </Button>
              </div>
            ) : (
              <>
                {activeListings.map((listing) => (
                  <UserListingCard
                    key={listing.id}
                    listing={listing}
                    onUpdate={refetchListings}
                  />
                ))}
                {soldListings.map((listing) => (
                  <UserListingCard
                    key={listing.id}
                    listing={listing}
                    onUpdate={refetchListings}
                  />
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {!reviews || reviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">Aucun avis</p>
                <p className="text-sm mt-2">Les avis de vos acheteurs apparaîtront ici</p>
              </div>
            ) : (
              reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-4">
            {!following || following.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">Aucun abonnement</p>
                <p className="text-sm mt-2">Suivez vos vendeurs préférés pour voir leurs nouvelles annonces</p>
              </div>
            ) : (
              following.map((seller: any) => (
                <Card 
                  key={seller.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    // Navigate to seller's listings or profile
                    navigate(`/search?seller=${seller.id}`);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={seller.avatar_url || ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {seller.full_name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold">{seller.full_name || "Utilisateur"}</h3>
                        
                        <div className="flex items-center gap-4 mt-1">
                          {seller.rating_average > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{seller.rating_average.toFixed(1)}</span>
                              <span className="text-xs">({seller.rating_count})</span>
                            </div>
                          )}
                          
                          {seller.total_sales > 0 && (
                            <div className="text-sm text-muted-foreground">
                              {seller.total_sales} vente{seller.total_sales > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
