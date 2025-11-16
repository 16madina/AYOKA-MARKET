import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";
import { translateCondition } from "@/utils/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import { sortListingsByLocation, getLocationPriority, getLocationBadgeColor } from "@/utils/geographicFiltering";
import { formatPriceWithConversion } from "@/utils/currency";

const RecentListings = () => {
  const { t, language } = useLanguage();
  
  // Vérifier d'abord si l'utilisateur est authentifié
  const { data: session } = useQuery({
    queryKey: ["authSession"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  // Fetch active ad banners
  const { data: adBanners = [] } = useQuery({
    queryKey: ["active-ad-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_banners")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
  
  // Ne charger le profil QUE si l'utilisateur est authentifié
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("city, country, currency")
        .eq("id", session.user.id)
        .single();
      
      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
      
      console.log("👤 User profile loaded:", data);
      return data;
    },
    enabled: !!session?.user, // NE S'EXÉCUTE QUE SI L'UTILISATEUR EST AUTHENTIFIÉ
  });
  
  const { data: listings, isLoading } = useQuery({
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
    staleTime: 1000 * 60 * 5, // Cache pendant 5 minutes
  });

  // RÈGLE : Priorité géographique pour utilisateurs authentifiés
  // - Si NON authentifié : afficher TOUS les listings (pas de filtre)
  // - Si authentifié : filtre strict (même ville ou même pays uniquement)
  const isAuthenticated = !!session?.user;
  
  const displayedListings = !isAuthenticated 
    ? listings || [] // Utilisateur non connecté : afficher tous les listings
    : listings?.filter(listing => {
        const locationInfo = getLocationPriority(
          listing.location,
          userProfile?.city || null,
          userProfile?.country || null
        );
        console.log('🏠 Listing:', listing.title, '| Location:', listing.location, '| User:', userProfile?.city, userProfile?.country, '| Priority:', locationInfo.priority);
        // STRICTEMENT même ville ou même pays - AUCUNE exception
        return locationInfo.priority === 'same-city' || locationInfo.priority === 'same-country';
      }) || [];

  console.log('📊 Auth:', isAuthenticated, '| Total listings:', listings?.length, '| Displayed listings:', displayedListings.length, '| User location:', userProfile?.city, userProfile?.country);

  const hasDisplayedListings = displayedListings.length > 0;
  const hasUserLocation = !!(userProfile?.city || userProfile?.country);


  // Fonction pour déterminer les badges à afficher (max 2, avec priorité)
  const getBadges = (listing: any) => {
    const badges: JSX.Element[] = [];
    
    // 1. Priorité: État (condition) - toujours affiché
    if (listing.condition) {
      badges.push(
        <Badge key="condition" className="bg-accent/90 text-accent-foreground backdrop-blur-sm text-xs font-medium">
          {translateCondition(listing.condition, language)}
        </Badge>
      );
    }
    
    // Note: Badge proximité supprimé car toutes les annonces affichées sont déjà locales
    // (filtrées par ville/pays), donc "À proximité" perd son sens
    
    return badges.slice(0, 2); // Maximum 2 badges
  };

  // Fonction de rendu pour une carte d'annonce
  const renderListingCard = (listing: any, index: number) => (
    <Card 
      key={listing.id} 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in group border-0 shadow-sm"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => window.location.href = `/listing/${listing.id}`}
    >
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {listing.images?.[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ objectPosition: 'center' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/50">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">{t('listings.no_image')}</p>
            </div>
          </div>
        )}
        {getBadges(listing).length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start">
            {getBadges(listing)}
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-base mb-2 line-clamp-2 leading-tight">
          {listing.title}
        </h3>
        <p className="font-bold text-primary text-base mb-2">
          {listing.price === 0 ? (
            <span className="text-green-600">
              {formatPriceWithConversion(0, listing.currency || "FCFA", userProfile?.currency || "FCFA")}
            </span>
          ) : (
            formatPriceWithConversion(listing.price, listing.currency || "FCFA", userProfile?.currency || "FCFA")
          )}
        </p>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground/70">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{listing.location}</span>
        </div>
      </CardContent>
    </Card>
  );

  // Composant skeleton pour le chargement
  const SkeletonCard = () => (
    <Card className="overflow-hidden border-0 shadow-sm">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );

  // Insert ad banners every 6 listings
  const listingsWithAds = useMemo(() => {
    if (!displayedListings.length || !adBanners.length) return displayedListings;
    
    const result: any[] = [];
    let bannerIndex = 0;
    
    displayedListings.forEach((listing, index) => {
      result.push(listing);
      
      // After every 6 listings, insert an ad banner
      if ((index + 1) % 6 === 0 && bannerIndex < adBanners.length) {
        result.push({ 
          ...adBanners[bannerIndex], 
          isAd: true 
        });
        bannerIndex = (bannerIndex + 1) % adBanners.length; // Cycle through banners
      }
    });
    
    return result;
  }, [displayedListings, adBanners]);

  const renderItem = (item: any, index: number) => {
    if (item.isAd) {
      return (
        <div key={`ad-${item.id}`} className="col-span-2 sm:col-span-2 lg:col-span-3 xl:col-span-4">
          <a
            href={item.link_url || '#'}
            target={item.link_url ? '_blank' : undefined}
            rel={item.link_url ? 'noopener noreferrer' : undefined}
            className="block w-full"
          >
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-32 md:h-40 object-cover rounded-lg hover:opacity-90 transition-opacity"
            />
          </a>
        </div>
      );
    }
    return renderListingCard(item, index);
  };

  return (
    <section className="py-8 px-4">
      <div className="max-w-screen-xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">{t('listings.recent')}</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : !listings || listings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">{t('listings.no_results')}</p>
            <p className="text-sm mt-2">{t('listings.be_first')}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Mobile: 2 colonnes, Tablet: 2 colonnes, Desktop: 3 colonnes, XL: 4 colonnes */}
            {hasDisplayedListings ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {listingsWithAds.map((item, index) => renderItem(item, index))}
              </div>
            ) : isAuthenticated && hasUserLocation ? (
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
