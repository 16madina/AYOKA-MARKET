import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageGallery } from "@/components/listing/ImageGallery";
import { SellerProfile } from "@/components/listing/SellerProfile";
import { FavoriteButton } from "@/components/listing/FavoriteButton";
import { ReportDialog } from "@/components/listing/ReportDialog";
import LocationMap from "@/components/listing/LocationMap";
import { ArrowLeft, MapPin, Eye, MessageCircle, Share2, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import BottomNav from "@/components/BottomNav";
import { addToRecentlyViewed } from "@/utils/recentlyViewed";
import { translateCondition } from "@/utils/translations";
import { formatPrice } from "@/utils/currency";
import { useEffect } from "react";
import { toast } from "sonner";

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("profiles")
        .select("currency, email_verified")
        .eq("id", user.id)
        .maybeSingle();
      
      return data;
    },
  });

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      if (!id) throw new Error("ID manquant");
      
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          profiles:user_id (full_name, avatar_url, location),
          categories (name, icon)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      // Increment views - Function exists but types not yet regenerated
      try {
        await supabase.rpc("increment_listing_views" as any, { listing_id: id });
      } catch (viewError) {
        console.log("Could not increment views:", viewError);
      }

      return data;
    },
  });

  // Fetch favorites count
  const { data: favoritesCount } = useQuery({
    queryKey: ["listing-favorites-count", id],
    queryFn: async () => {
      if (!id) return 0;
      
      const { count, error } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("listing_id", id);

      if (error) throw error;
      return count || 0;
    },
  });

  useEffect(() => {
    if (listing?.id) {
      addToRecentlyViewed(listing.id);
    }
  }, [listing?.id]);

  const handleContact = () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if email is verified
    if (!userProfile?.email_verified) {
      toast.error("Email non vérifié", {
        description: "Vous devez vérifier votre email pour contacter les vendeurs. Consultez votre profil pour renvoyer l'email de vérification.",
        action: {
          label: "Voir mon profil",
          onClick: () => navigate("/profile"),
        },
      });
      return;
    }

    // Create or get conversation
    const createConversation = async () => {
      try {
        // Check if conversation exists
        const { data: existing } = await supabase
          .from("conversations")
          .select("id")
          .eq("listing_id", id)
          .eq("buyer_id", user.id)
          .eq("seller_id", listing.user_id)
          .maybeSingle();

        if (existing) {
          navigate(`/messages?conversation=${existing.id}`);
          return;
        }

        // Create new conversation
        const { data: newConv, error } = await supabase
          .from("conversations")
          .insert({
            listing_id: id,
            buyer_id: user.id,
            seller_id: listing.user_id,
          })
          .select()
          .single();

        if (error) throw error;

        navigate(`/messages?conversation=${newConv.id}`);
      } catch (error) {
        console.error("Error creating conversation:", error);
        navigate("/messages");
      }
    };

    createConversation();
  };

  const handleShare = async (method?: string) => {
    if (!listing) return;
    
    const currency = userProfile?.currency || "FCFA";
    const shareText = listing.price === 0 
      ? `${listing.title} - Gratuit` 
      : `${listing.title} - ${formatPrice(listing.price, currency)}`;
    const shareUrl = window.location.href;

    if (method === "copy") {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Lien copié !");
      setShareDialogOpen(false);
      return;
    }

    if (method === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
      setShareDialogOpen(false);
      return;
    }

    if (method === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
      setShareDialogOpen(false);
      return;
    }

    // Native share
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.error("Share error:", error);
      }
    }
    setShareDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-muted-foreground">Annonce non trouvée</div>
        <Button onClick={() => navigate("/")}>Retour à l'accueil</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-muted/30">
      <div className="max-w-screen-xl mx-auto p-4 md:p-6 pt-safe">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/");
            }
          }}
          className="mb-4 mt-2 min-h-[44px] min-w-[44px]"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <Card>
              <CardContent className="p-4">
                <ImageGallery 
                  images={listing.images || []} 
                  title={`Image de ${listing.title} - ${listing.categories?.name || 'produit'} à ${listing.location}`} 
                />
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge>{listing.categories?.name}</Badge>
                      {listing.condition && (
                        <Badge variant="outline">
                          {translateCondition(listing.condition)}
                        </Badge>
                      )}
                      {listing.status === "sold" && (
                        <Badge className="bg-gray-500">Vendu</Badge>
                      )}
                      {listing.status === "reserved" && (
                        <Badge className="bg-orange-500">Réservé</Badge>
                      )}
                      {listing.status === "active" && (
                        <Badge className="bg-green-600">Disponible</Badge>
                      )}
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold mb-2">{listing.title}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{listing.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 shrink-0" />
                        <span className="whitespace-nowrap">{listing.views === 1 ? "1 vue" : `${listing.views || 0} vues`}</span>
                      </div>
                      <span className="whitespace-nowrap">
                        {formatDistanceToNow(new Date(listing.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <FavoriteButton listingId={listing.id} />
                    <ReportDialog listingId={listing.id} />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setShareDialogOpen(true)}
                      className="relative min-h-[44px] min-w-[44px]"
                      aria-label="Partager cette annonce"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {favoritesCount !== undefined && favoritesCount > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground pt-2">
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    <span>{favoritesCount} {favoritesCount === 1 ? "personne intéressée" : "personnes intéressées"}</span>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="text-2xl font-bold mb-4">
                    {listing.price === 0 ? (
                      <span className="text-green-600">Gratuit</span>
                    ) : (
                      <span className="text-primary">
                        {formatPrice(listing.price, userProfile?.currency || "FCFA")}
                      </span>
                    )}
                  </div>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleContact}
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Envoyer un message
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h2 className="font-semibold text-lg mb-3">Description</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap break-words overflow-wrap-anywhere">
                    {listing.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <SellerProfile userId={listing.user_id} />
            <LocationMap location={listing.location} />
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partager cette annonce</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3"
              onClick={() => handleShare("whatsapp")}
            >
              <span className="text-xl">📱</span>
              WhatsApp
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3"
              onClick={() => handleShare("facebook")}
            >
              <span className="text-xl">📘</span>
              Facebook
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3"
              onClick={() => handleShare("copy")}
            >
              <span className="text-xl">📋</span>
              Copier le lien
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default ListingDetail;
