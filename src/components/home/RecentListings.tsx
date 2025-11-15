import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { translateCondition } from "@/utils/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import { sortListingsByLocation, getLocationPriority, getLocationBadgeColor } from "@/utils/geographicFiltering";
import { formatPriceWithConversion } from "@/utils/currency";

const RecentListings = () => {
  const { t, language } = useLanguage();
  
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("city, country, currency")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
      
      console.log("👤 User profile loaded:", data);
      return data;
    },
  });
  
  const { data: listings } = useQuery({
    queryKey: ["recent-listings", userProfile?.city, userProfile?.country],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          profiles:user_id (full_name, avatar_url),
          categories (name)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      // Trier par priorité géographique si l'utilisateur a un profil
      if (userProfile?.city || userProfile?.country) {
        return sortListingsByLocation(data, userProfile.city, userProfile.country);
      }
      
      return data;
    },
  });

  // RÈGLE STRICTE : Priorité géographique absolue
  // 1. Même ville et même pays uniquement
  // 2. Si aucune annonce locale, ne rien afficher (pas de pays voisins sur page d'accueil)
  const localListings = listings?.filter(listing => {
    const locationInfo = getLocationPriority(
      listing.location,
      userProfile?.city || null,
      userProfile?.country || null
    );
    console.log('🏠 Listing:', listing.title, '| Location:', listing.location, '| User:', userProfile?.city, userProfile?.country, '| Priority:', locationInfo.priority);
    // STRICTEMENT même ville ou même pays - AUCUNE exception
    return locationInfo.priority === 'same-city' || locationInfo.priority === 'same-country';
  }) || [];

  console.log('📊 Total listings:', listings?.length, '| Local listings:', localListings.length, '| User location:', userProfile?.city, userProfile?.country);

  // Ne pas afficher les annonces distantes (pays voisins ou autres)
  const distantListings: any[] = [];

  const hasLocalListings = localListings.length > 0;
  const hasUserLocation = !!(userProfile?.city || userProfile?.country);


  // Fonction de rendu pour une carte d'annonce
  const renderListingCard = (listing: any, index: number) => (
    <Card 
      key={listing.id} 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in group border-0 shadow-sm"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => window.location.href = `/listing/${listing.id}`}
    >
      <div className="aspect-square bg-muted relative overflow-hidden">
        {listing.images?.[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            {t('listings.no_image')}
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start">
          <Badge className="bg-accent/90 text-accent-foreground backdrop-blur-sm text-xs">
            {translateCondition(listing.condition, language)}
          </Badge>
          {(() => {
            const locationInfo = getLocationPriority(
              listing.location,
              userProfile?.city || null,
              userProfile?.country || null
            );
            if (locationInfo.priority !== 'other') {
              return (
                <Badge className={`${getLocationBadgeColor(locationInfo.priority)} backdrop-blur-sm text-xs flex items-center gap-1`}>
                  <MapPin className="h-3 w-3" />
                  {locationInfo.distance}
                </Badge>
              );
            }
            return null;
          })()}
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm mb-1 line-clamp-2">
          {listing.title}
        </h3>
        <p className="font-bold text-primary text-base mb-1">
          {listing.price === 0 ? (
            <span className="text-green-600">
              {formatPriceWithConversion(0, listing.currency || "FCFA", userProfile?.currency || "FCFA")}
            </span>
          ) : (
            formatPriceWithConversion(listing.price, listing.currency || "FCFA", userProfile?.currency || "FCFA")
          )}
        </p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">{listing.location}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section className="py-8 px-4">
      <div className="max-w-screen-xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">{t('listings.recent')}</h2>
        {!listings || listings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">{t('listings.no_results')}</p>
            <p className="text-sm mt-2">{t('listings.be_first')}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Afficher uniquement les annonces du même pays */}
            {hasLocalListings ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {localListings.map((listing, index) => renderListingCard(listing, index))}
              </div>
            ) : hasUserLocation ? (
              <div className="text-center py-6 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-muted-foreground font-medium">{t('listings.no_local')}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentListings;
