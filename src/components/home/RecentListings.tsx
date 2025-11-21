import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Navigation } from "lucide-react";
import { translateCondition } from "@/utils/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import { sortListingsByLocation, getLocationPriority } from "@/utils/geographicFiltering";
import { formatPriceWithConversion } from "@/utils/currency";
import { getUserLocation, geocodeLocation, calculateDistance, formatDistance } from "@/utils/distanceCalculation";

const RecentListings = () => {
  const { t, language } = useLanguage();
  const [guestLocation, setGuestLocation] = useState<{ city: string | null; country: string | null }>(() => {
    // Récupérer la localisation stockée
    const stored = localStorage.getItem('guestLocation');
    return stored ? JSON.parse(stored) : { city: null, country: null };
  });
  
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [listingDistances, setListingDistances] = useState<{ [key: string]: number }>({});

  // Détecter automatiquement la localisation pour les visiteurs
  useEffect(() => {
    // Si déjà détectée, ne pas redemander
    if (guestLocation.city || guestLocation.country) return;

    // Utiliser l'API de géolocalisation du navigateur
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Utiliser une API de reverse geocoding (OpenStreetMap Nominatim)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`,
              {
                headers: {
                  'User-Agent': 'DjassaMarket/1.0'
                }
              }
            );
            const data = await response.json();
            
            const location = {
              city: data.address?.city || data.address?.town || data.address?.village || null,
              country: data.address?.country || null
            };
            
            setGuestLocation(location);
            localStorage.setItem('guestLocation', JSON.stringify(location));
            console.log('📍 Guest location detected:', location);
          } catch (error) {
            console.error('Error fetching location details:', error);
          }
        },
        (error) => {
          console.log('Geolocation permission denied or not available:', error);
        }
      );
    }
  }, [guestLocation]);
  
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
      
      // Ne PAS trier par priorité géographique - garder l'ordre chronologique
      // Le filtrage sera fait après pour ne garder que les annonces pertinentes
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache pendant 5 minutes
  });

  // Get user's coordinates from browser geolocation, user profile, or guest location
  useEffect(() => {
    const getCoordinates = async () => {
      // Try browser geolocation first
      const browserCoords = await getUserLocation();
      if (browserCoords) {
        setUserCoordinates(browserCoords);
        console.log('📍 User coordinates (browser):', browserCoords);
        return;
      }

      // Fallback: use user profile location (authenticated users)
      if (userProfile?.city && userProfile?.country) {
        const locationString = `${userProfile.city}, ${userProfile.country}`;
        const profileCoords = await geocodeLocation(locationString);
        if (profileCoords) {
          setUserCoordinates(profileCoords);
          console.log('📍 User coordinates (profile):', profileCoords);
          return;
        }
      } else if (userProfile?.country) {
        const profileCoords = await geocodeLocation(userProfile.country);
        if (profileCoords) {
          setUserCoordinates(profileCoords);
          console.log('📍 User coordinates (country):', profileCoords);
          return;
        }
      }
      
      // Fallback: use guest location (non-authenticated users)
      if (guestLocation.city && guestLocation.country) {
        const locationString = `${guestLocation.city}, ${guestLocation.country}`;
        const guestCoords = await geocodeLocation(locationString);
        if (guestCoords) {
          setUserCoordinates(guestCoords);
          console.log('📍 Guest coordinates:', guestCoords);
          return;
        }
      } else if (guestLocation.country) {
        const guestCoords = await geocodeLocation(guestLocation.country);
        if (guestCoords) {
          setUserCoordinates(guestCoords);
          console.log('📍 Guest coordinates (country):', guestCoords);
        }
      }
    };

    getCoordinates();
  }, [userProfile?.city, userProfile?.country, guestLocation.city, guestLocation.country]);

  // Calculate distances for listings
  useEffect(() => {
    if (!userCoordinates || !listings) return;

    const calculateDistances = async () => {
      const distances: { [key: string]: number } = {};
      
      for (const listing of listings) {
        if (!listing.location) continue;
        
        try {
          const listingCoords = await geocodeLocation(listing.location);
          if (listingCoords) {
            const distance = calculateDistance(
              userCoordinates.lat,
              userCoordinates.lng,
              listingCoords.lat,
              listingCoords.lng
            );
            distances[listing.id] = distance;
          }
        } catch (error) {
          console.error(`Error calculating distance for ${listing.location}:`, error);
        }
      }
      
      setListingDistances(distances);
    };

    calculateDistances();
  }, [userCoordinates, listings]);

  // RÈGLE : Trier les annonces par proximité pour les utilisateurs avec localisation (authentifiés ou invités)
  // - Utilisateurs avec localisation: tri par proximité (même ville > même pays > pays voisins > autres)
  // - Utilisateurs sans localisation: ordre chronologique par défaut
  const isAuthenticated = !!session?.user;
  const userCity = userProfile?.city || guestLocation.city || null;
  const userCountry = userProfile?.country || guestLocation.country || null;
  
  const hasValidLocation = !!(userCity?.trim() || userCountry?.trim());
  
  // Trier par proximité pour tous les utilisateurs avec une localisation
  // (authentifiés ou invités avec géolocalisation activée)
  const displayedListings = hasValidLocation
    ? sortListingsByLocation(listings || [], userCity, userCountry)
    : listings || [];

  console.log('📊 Auth:', isAuthenticated, '| Total listings:', listings?.length, '| Displayed listings:', displayedListings.length, '| User location:', userCity, userCountry, '| Sorting by proximity:', isAuthenticated && hasValidLocation);

  const hasDisplayedListings = displayedListings.length > 0;
  const hasUserLocation = !!(userProfile?.city || userProfile?.country);


  // Fonction pour obtenir le badge de proximité (pour tous les utilisateurs avec localisation)
  const getProximityBadge = (listing: any) => {
    if (!hasValidLocation) return null;
    
    const locationInfo = getLocationPriority(listing.location, userCity, userCountry);
    
    const badges: Record<string, { emoji: string; text: string; color: string }> = {
      'same-city': { emoji: '📍', text: t('proximity.same_city') || 'Votre ville', color: 'bg-green-500/80' },
      'same-country': { emoji: '🏳️', text: t('proximity.same_country') || 'Votre pays', color: 'bg-blue-500/80' },
      'neighboring-country': { emoji: '🌍', text: t('proximity.neighboring') || 'Pays voisin', color: 'bg-orange-500/80' },
    };
    
    const badge = badges[locationInfo.priority];
    if (!badge) return null;
    
    return (
      <div className={`${badge.color} text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1 font-medium`}>
        <span>{badge.emoji}</span>
        <span className="hidden sm:inline">{badge.text}</span>
      </div>
    );
  };

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
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 leading-tight">
          {listing.title}
        </h3>
        <p className="font-bold text-primary text-sm mb-2">
          {listing.price === 0 ? (
            <span className="text-green-600">
              {formatPriceWithConversion(0, listing.currency || "FCFA", userProfile?.currency || "FCFA")}
            </span>
          ) : (
            formatPriceWithConversion(listing.price, listing.currency || "FCFA", userProfile?.currency || "FCFA")
          )}
        </p>
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground/70">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{listing.location}</span>
          </div>
          {listingDistances[listing.id] !== undefined && (
            <div className="flex items-center gap-1 text-primary font-medium shrink-0">
              <Navigation className="h-3.5 w-3.5" />
              <span className="text-xs">{formatDistance(listingDistances[listing.id])}</span>
            </div>
          )}
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
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {listingsWithAds.map((item, index) => renderItem(item, index))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentListings;
