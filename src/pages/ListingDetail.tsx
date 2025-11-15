import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageGallery } from "@/components/listing/ImageGallery";
import { SellerProfile } from "@/components/listing/SellerProfile";
import { FavoriteButton } from "@/components/listing/FavoriteButton";
import { ArrowLeft, MapPin, Eye, MessageCircle, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import BottomNav from "@/components/BottomNav";

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

      // Increment views
      await supabase.rpc("increment_listing_views", { listing_id: id });

      return data;
    },
  });

  const handleContact = () => {
    // TODO: Implémenter la messagerie
    navigate("/messages");
  };

  const handleShare = async () => {
    if (navigator.share && listing) {
      try {
        await navigator.share({
          title: listing.title,
          text: `${listing.title} - ${listing.price.toLocaleString()} FCFA`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Share error:", error);
      }
    }
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

  const conditionLabels: Record<string, string> = {
    new: "Neuf",
    like_new: "Comme neuf",
    good: "Bon état",
    fair: "État moyen",
  };

  return (
    <div className="min-h-screen pb-24 bg-muted/30">
      <div className="max-w-screen-xl mx-auto p-4 md:p-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <Card>
              <CardContent className="p-4">
                <ImageGallery images={listing.images || []} title={listing.title} />
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>{listing.categories?.name}</Badge>
                      {listing.condition && (
                        <Badge variant="outline">
                          {conditionLabels[listing.condition]}
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{listing.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{listing.views || 0} vues</span>
                      </div>
                      <span>
                        {formatDistanceToNow(new Date(listing.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <FavoriteButton listingId={listing.id} />
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-3xl font-bold text-primary mb-4">
                    {listing.price.toLocaleString()} FCFA
                  </div>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleContact}
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Contacter le vendeur
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h2 className="font-semibold text-lg mb-3">Description</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <SellerProfile userId={listing.user_id} />
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default ListingDetail;
