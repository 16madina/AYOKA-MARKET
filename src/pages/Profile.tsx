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
import { LogOut, Edit, Settings, Shield, Bell, Share2, ArrowLeft, Users, Star, MapPin, Calendar, Package, TrendingUp, Award, Heart, Receipt, CheckCircle2, X, Mail, CheckCircle } from "lucide-react";
import { toast as toastHook } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!roles);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        // Check admin status on auth state change
        setTimeout(async () => {
          if (session?.user) {
            const { data: roles } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .eq("role", "admin")
              .maybeSingle();
            setIsAdmin(!!roles);
          }
        }, 0);
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

  const { data: favorites } = useQuery({
    queryKey: ["user-favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          *,
          listings (
            *,
            categories (name)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleSendVerificationEmail = async () => {
    try {
      if (!user?.email) {
        toastHook({
          title: "Erreur",
          description: "Impossible de récupérer votre email",
          variant: "destructive",
        });
        return;
      }

      const result = await supabase.functions.invoke('send-verification-email', {
        body: {
          email: user.email,
          userName: profile?.full_name || "utilisateur",
        },
      });

      if (result.error) {
        console.error("Error sending verification email:", result.error);
        
        // Handle rate limit error specifically
        if (result.error.message?.includes("rate_limit") || result.error.message?.includes("429")) {
          toastHook({
            title: "Trop de demandes",
            description: "Veuillez patienter quelques secondes avant de renvoyer l'email de vérification.",
            variant: "destructive",
          });
          return;
        }
        
        // Handle network errors
        if (result.error.message?.includes("Failed to send a request")) {
          toastHook({
            title: "Erreur de connexion",
            description: "Veuillez vérifier votre connexion internet et réessayer.",
            variant: "destructive",
          });
          return;
        }
        
        throw result.error;
      }

      setShowVerificationAlert(true);
    } catch (error) {
      console.error('Error sending verification email:', error);
      toastHook({
        title: "Erreur",
        description: "Impossible d'envoyer l'email de vérification",
        variant: "destructive",
      });
    }
  };

  const { data: transactions } = useQuery({
    queryKey: ["user-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          listings (
            title,
            images,
            categories (name)
          )
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
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
  
  const memberSince = profile?.created_at ? new Date(profile.created_at) : null;
  const monthsSinceMember = memberSince ? Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;
  
  // Calculate badges
  const badges = [];
  if (profile?.email_verified) badges.push({ icon: CheckCircle2, label: "Email vérifié", color: "text-green-500" });
  if ((profile?.total_sales || 0) >= 10) badges.push({ icon: Award, label: "Vendeur expert", color: "text-yellow-500" });
  if ((profile?.rating_average || 0) >= 4.5 && (profile?.rating_count || 0) >= 5) badges.push({ icon: Star, label: "Excellent vendeur", color: "text-orange-500" });
  if (monthsSinceMember >= 12) badges.push({ icon: Calendar, label: "Membre fidèle", color: "text-purple-500" });

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-b from-background to-muted/20">
      {/* Header with Cover */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20" />
        
        {/* Header Actions */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full transition-all hover:scale-105 active:scale-95"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full transition-all hover:scale-105 active:scale-95"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Profile Picture */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-16">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-background border-4 border-background shadow-xl">
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/70">
                  <span className="text-4xl font-bold text-primary-foreground">
                    {fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
            )}
          </div>
          {profile?.email_verified ? (
            <div className="absolute bottom-1 right-1 bg-green-600 rounded-full p-1 border-2 border-background">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          ) : (
            <div className="absolute bottom-1 right-1 bg-muted rounded-full px-2 py-1 border-2 border-background">
              <span className="text-[10px] text-muted-foreground font-medium">Non vérifié</span>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="mt-20 px-6 space-y-6">
        {/* Name and Location */}
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-3xl font-bold">{fullName}</h1>
          <div className="flex flex-col items-center gap-2">
            <p className="text-muted-foreground text-sm">{user?.email}</p>
            {!profile?.email_verified && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSendVerificationEmail}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Vérifier mon compte
              </Button>
            )}
          </div>
          {(profile?.city || profile?.country) && (
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {profile.city && profile.country 
                  ? `${profile.city}, ${profile.country}`
                  : profile.city || profile.country}
              </span>
            </div>
          )}
          {memberSince && (
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Membre depuis {memberSince.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
            </div>
          )}
        </div>

        {/* Bio Section */}
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm animate-fade-in">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center italic">
              {profile?.location || "Aucune bio pour le moment. Présentez-vous à vos futurs acheteurs !"}
            </p>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/20">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeListings.length}</p>
                  <p className="text-xs text-muted-foreground">Annonces actives</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-500/10 to-green-500/5 hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-green-500/20">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{profile?.total_sales || 0}</p>
                  <p className="text-xs text-muted-foreground">Articles vendus</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-yellow-500/20">
                  <Star className="h-6 w-6 text-yellow-600 fill-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{profile?.rating_average?.toFixed(1) || '0.0'}</p>
                  <p className="text-xs text-muted-foreground">Note moyenne</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-500/20">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{profile?.followers_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Abonnés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 animate-fade-in">
            {badges.map((badge, index) => (
              <div 
                key={index} 
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-muted to-muted/50 shadow-sm text-xs font-medium transition-all hover:scale-105 active:scale-95"
              >
                <badge.icon className={`h-4 w-4 ${badge.color}`} />
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="rounded-full h-12 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              onClick={() => navigate("/edit-profile")}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button 
              variant="outline" 
              className="rounded-full h-12 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
          </div>

          {isAdmin && (
            <Button 
              className="w-full rounded-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => navigate("/admin")}
            >
              <Shield className="h-4 w-4 mr-2" />
              Panneau d'administration
            </Button>
          )}

          <Button
            variant="outline" 
            className="w-full rounded-full h-12 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-destructive border-destructive/20 hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Se déconnecter
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-6">
        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-6 bg-muted/30 backdrop-blur-sm p-1.5 h-14 rounded-2xl shadow-sm">
            <TabsTrigger 
              value="listings"
              className="data-[state=active]:bg-background data-[state=active]:shadow-md rounded-xl transition-all data-[state=active]:scale-[1.02] flex flex-col items-center gap-1 py-2"
            >
              <Package className="h-5 w-5" />
              <span className="text-[10px] font-medium">Annonces</span>
            </TabsTrigger>
            <TabsTrigger 
              value="favorites"
              className="data-[state=active]:bg-background data-[state=active]:shadow-md rounded-xl transition-all data-[state=active]:scale-[1.02] flex flex-col items-center gap-1 py-2"
            >
              <Heart className="h-5 w-5" />
              <span className="text-[10px] font-medium">Favoris</span>
            </TabsTrigger>
            <TabsTrigger 
              value="transactions"
              className="data-[state=active]:bg-background data-[state=active]:shadow-md rounded-xl transition-all data-[state=active]:scale-[1.02] flex flex-col items-center gap-1 py-2"
            >
              <Receipt className="h-5 w-5" />
              <span className="text-[10px] font-medium">Achats</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reviews"
              className="data-[state=active]:bg-background data-[state=active]:shadow-md rounded-xl transition-all data-[state=active]:scale-[1.02] flex flex-col items-center gap-1 py-2"
            >
              <Star className="h-5 w-5" />
              <span className="text-[10px] font-medium">Avis</span>
            </TabsTrigger>
            <TabsTrigger 
              value="following"
              className="data-[state=active]:bg-background data-[state=active]:shadow-md rounded-xl transition-all data-[state=active]:scale-[1.02] flex flex-col items-center gap-1 py-2"
            >
              <Users className="h-5 w-5" />
              <span className="text-[10px] font-medium">Suivis</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4 animate-fade-in">
            {!listings || listings.length === 0 ? (
              <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
                <CardContent className="text-center py-16 text-muted-foreground">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-semibold">Aucune annonce</p>
                  <p className="text-sm mt-2 mb-6">Commencez à publier vos articles !</p>
                  <Button 
                    className="rounded-full px-6 shadow-lg transition-all hover:scale-105 active:scale-95"
                    onClick={() => navigate("/publish")}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Publier une annonce
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeListings.map((listing, index) => (
                  <div 
                    key={listing.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <UserListingCard
                      listing={listing}
                      onUpdate={refetchListings}
                    />
                  </div>
                ))}
                {soldListings.map((listing, index) => (
                  <div 
                    key={listing.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${(activeListings.length + index) * 50}ms` }}
                  >
                    <UserListingCard
                      listing={listing}
                      onUpdate={refetchListings}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-3 animate-fade-in">
            {!favorites || favorites.length === 0 ? (
              <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
                <CardContent className="text-center py-16 text-muted-foreground">
                  <Heart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-semibold">Aucun favori</p>
                  <p className="text-sm mt-2">Ajoutez des annonces à vos favoris pour les retrouver facilement</p>
                </CardContent>
              </Card>
            ) : (
              favorites.map((favorite: any, index) => (
                <Card 
                  key={favorite.id} 
                  className="cursor-pointer shadow-md border-0 bg-card/50 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => navigate(`/listing/${favorite.listing_id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-muted flex-shrink-0 shadow-sm">
                        {favorite.listings?.images?.[0] ? (
                          <img 
                            src={favorite.listings.images[0]} 
                            alt={favorite.listings.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                            <Package className="h-10 w-10 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate text-base">{favorite.listings?.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{favorite.listings?.categories?.name}</p>
                        <p className="text-xl font-bold text-primary mt-2">
                          {favorite.listings?.price.toLocaleString()} {favorite.listings?.currency || 'FCFA'}
                        </p>
                      </div>
                      <Heart className="h-5 w-5 text-destructive fill-destructive flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-3 animate-fade-in">
            {!transactions || transactions.length === 0 ? (
              <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
                <CardContent className="text-center py-16 text-muted-foreground">
                  <Receipt className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-semibold">Aucune transaction</p>
                  <p className="text-sm mt-2">Votre historique de transactions apparaîtra ici</p>
                </CardContent>
              </Card>
            ) : (
              transactions.map((transaction: any, index) => (
                <Card 
                  key={transaction.id}
                  className="shadow-md border-0 bg-card/50 backdrop-blur-sm animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-muted flex-shrink-0 shadow-sm">
                        {transaction.listings?.images?.[0] ? (
                          <img 
                            src={transaction.listings.images[0]} 
                            alt={transaction.listings.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                            <Package className="h-10 w-10 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold truncate text-base">{transaction.listings?.title}</h3>
                          {transaction.buyer_id === user?.id ? (
                            <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-700 font-medium whitespace-nowrap">Achat</span>
                          ) : (
                            <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/10 text-green-700 font-medium whitespace-nowrap">Vente</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{transaction.listings?.categories?.name}</p>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xl font-bold text-primary">
                            {transaction.amount.toLocaleString()} FCFA
                          </p>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                            </p>
                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-1 ${
                              transaction.status === 'completed' 
                                ? 'bg-green-500/10 text-green-700'
                                : 'bg-yellow-500/10 text-yellow-700'
                            }`}>
                              {transaction.status === 'completed' ? '✓ Complétée' : '⏱ En cours'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4 animate-fade-in">
            {!reviews || reviews.length === 0 ? (
              <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
                <CardContent className="text-center py-16 text-muted-foreground">
                  <Star className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-semibold">Aucun avis</p>
                  <p className="text-sm mt-2">Les avis de vos acheteurs apparaîtront ici</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/5">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                          <Star className="h-8 w-8 text-yellow-600 fill-yellow-600" />
                        </div>
                        <div>
                          <p className="text-4xl font-bold">{profile?.rating_average?.toFixed(1) || '0.0'}</p>
                          <div className="flex items-center gap-1 mt-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${
                                  i < Math.round(profile?.rating_average || 0)
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-muted-foreground/20'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">{profile?.rating_count || 0}</p>
                        <p className="text-xs text-muted-foreground mt-1">Avis reçus</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="space-y-3">
                  {reviews.map((review, index) => (
                    <div 
                      key={review.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <ReviewCard review={review} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-3 animate-fade-in">
            {!following || following.length === 0 ? (
              <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
                <CardContent className="text-center py-16 text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-semibold">Aucun abonnement</p>
                  <p className="text-sm mt-2">Suivez vos vendeurs préférés pour voir leurs nouvelles annonces</p>
                </CardContent>
              </Card>
            ) : (
              following.map((seller: any, index) => (
                <Card 
                  key={seller.id} 
                  className="cursor-pointer shadow-md border-0 bg-card/50 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => navigate(`/seller/${seller.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 ring-2 ring-primary/10 shadow-sm">
                        <AvatarImage src={seller.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xl font-bold">
                          {seller.full_name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate text-base">{seller.full_name}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10">
                            <Star className="h-3 w-3 text-yellow-600 fill-yellow-600" />
                            <span className="text-xs font-semibold">{seller.rating_average?.toFixed(1) || '0.0'}</span>
                            <span className="text-[10px] text-muted-foreground">
                              ({seller.rating_count || 0})
                            </span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="text-xs font-semibold text-green-700">
                              {seller.total_sales || 0} ventes
                            </span>
                          </div>
                        </div>
                      </div>
                      <Users className="h-5 w-5 text-primary flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={showVerificationAlert} onOpenChange={setShowVerificationAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Email de vérification envoyé
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="text-base">
                Nous vous avons envoyé un email de vérification à <strong>{user?.email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation.
              </p>
              <p className="text-sm text-orange-600 font-medium">
                ⚠️ N'oubliez pas de vérifier vos spams si vous ne trouvez pas l'email !
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>J'ai compris</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default Profile;
