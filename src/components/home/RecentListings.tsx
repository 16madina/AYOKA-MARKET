import { useMemo, useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Navigation, Rocket, Sparkles } from "lucide-react";
import { translateCondition } from "@/utils/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocationPriority } from "@/utils/geographicFiltering";
import { formatPriceWithConversion, getConvertedPrice } from "@/utils/currency";
import { getUserLocation, geocodeLocation, calculateDistance, formatDistance } from "@/utils/distanceCalculation";
import { formatRelativeTime } from "@/utils/timeFormatting";

async function reverseGeocodeCoords(lat: number, lng: number): Promise<{ city: string | null; country: string | null } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          "User-Agent": "AyokaMarket/1.0",
        },
      }
    );
    const data = await response.json();
    return {
      city: data.address?.city || data.address?.town || data.address?.village || null,
      country: data.address?.country || null,
    };
  } catch (error) {
    console.error("Error reverse geocoding coords:", error);
    return null;
  }
}

const RecentListings = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
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
                  'User-Agent': 'AyokaMarket/1.0'
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
  // Rechargement rapide pour s'assurer que le tri par localisation fonctionne
  const { data: userProfile, refetch: refetchProfile } = useQuery({
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
    enabled: !!session?.user,
    staleTime: 0, // Toujours recharger le profil pour avoir les données à jour
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  
  // Fetch active boosts to prioritize boosted listings
  const { data: activeBoosts = [] } = useQuery({
    queryKey: ["active-boosts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listing_boosts")
        .select("listing_id")
        .eq("is_active", true)
        .gte("ends_at", new Date().toISOString());
      
      if (error) throw error;
      return data?.map(b => b.listing_id) || [];
    },
    staleTime: 1000 * 60 * 2, // Cache pendant 2 minutes
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
        .limit(30);
      
      if (error) throw error;
      
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

        // IMPORTANT: if the authenticated user's profile has no city/country yet,
        // use GPS -> reverse geocode and persist (this fixes "newest first" sorting).
        const needsProfileLocation = !!session?.user?.id && !userProfile?.city && !userProfile?.country;
        const needsGuestFallback = !guestLocation.city && !guestLocation.country;

        if (needsProfileLocation || needsGuestFallback) {
          const inferred = await reverseGeocodeCoords(browserCoords.lat, browserCoords.lng);
          if (inferred?.city || inferred?.country) {
            // Use as immediate fallback for sorting
            setGuestLocation(inferred);
            localStorage.setItem('guestLocation', JSON.stringify(inferred));

            if (needsProfileLocation) {
              const update: { city?: string; country?: string } = {};
              if (!userProfile?.city && inferred.city) update.city = inferred.city;
              if (!userProfile?.country && inferred.country) update.country = inferred.country;

              if (Object.keys(update).length > 0) {
                const { error } = await supabase
                  .from('profiles')
                  .update(update)
                  .eq('id', session!.user.id);

                if (error) {
                  console.error('Error updating user profile location:', error);
                } else {
                  console.log('✅ Profile location updated from GPS:', update);
                }
              }
            }
          }
        }
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
  }, [session?.user?.id, userProfile?.city, userProfile?.country, guestLocation.city, guestLocation.country]);

  // Calculate distances for listings using stored GPS coordinates or geocoding
  useEffect(() => {
    if (!userCoordinates || !listings) return;

    const calculateDistances = async () => {
      const distances: { [key: string]: number } = {};
      
      for (const listing of listings) {
        // Use stored GPS coordinates if available
        if (listing.latitude && listing.longitude) {
          try {
            const distance = calculateDistance(
              userCoordinates.lat,
              userCoordinates.lng,
              Number(listing.latitude),
              Number(listing.longitude)
            );
            distances[listing.id] = distance;
          } catch (error) {
            console.error(`Error calculating distance for listing ${listing.id}:`, error);
          }
        } else if (listing.location) {
          // Fallback: geocode the location string (with rate limiting)
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
            console.error(`Error geocoding listing ${listing.id}:`, error);
          }
        }
      }
      
      setListingDistances(distances);
    };

    calculateDistances();
  }, [userCoordinates, listings]);

  // RÈGLE : Trier les annonces par boost puis par proximité pour les utilisateurs avec localisation
  // - Annonces boostées en premier (top liste)
  // - Puis par proximité (même ville > même pays > pays voisins > autres)
  // - Utilisateurs sans localisation: ordre chronologique par défaut
  const isAuthenticated = !!session?.user;
  // Treat empty strings as null
  const rawCity = userProfile?.city || guestLocation.city || null;
  const rawCountry = userProfile?.country || guestLocation.country || null;
  const userCity = rawCity?.trim() ? rawCity.trim() : null;
  const userCountry = rawCountry?.trim() ? rawCountry.trim() : null;
  
  const hasValidLocation = !!(userCity || userCountry);
  
  // DEBUG: Log pour vérifier les valeurs
  console.log('🔍 DEBUG Sorting - userCity:', userCity, '| userCountry:', userCountry, '| hasValidLocation:', hasValidLocation, '| profile:', userProfile);
  
  // Trier : 1) Annonces boostées en premier, 2) Puis par proximité
  const sortedListings = useMemo(() => {
    if (!listings) return [];

    const priorityOrder: Record<ReturnType<typeof getLocationPriority>['priority'], number> = {
      'same-city': 0,
      'same-country': 1,
      'neighboring-country': 2,
      'west-africa': 3,
      'other': 4,
    };

    const sortByProximityThenRecency = (items: any[]) => {
      return [...items].sort((a, b) => {
        const pa = getLocationPriority(a.location, userCity, userCountry).priority;
        const pb = getLocationPriority(b.location, userCity, userCountry).priority;
        const diff = priorityOrder[pa] - priorityOrder[pb];
        if (diff !== 0) return diff;

        const ta = Date.parse(a.created_at) || 0;
        const tb = Date.parse(b.created_at) || 0;
        return tb - ta; // plus récent d'abord (dans le même groupe)
      });
    };
    
    // Séparer les annonces boostées des autres
    const boostedListings = listings.filter(l => activeBoosts.includes(l.id));
    const regularListings = listings.filter(l => !activeBoosts.includes(l.id));
    
    // TOUJOURS trier par proximité si localisation disponible
    if (hasValidLocation) {
      const sortedBoosted = sortByProximityThenRecency(boostedListings);
      const sortedRegular = sortByProximityThenRecency(regularListings);
      
      // DEBUG: Afficher les priorités pour les premières annonces
      if (sortedRegular.length > 0) {
        const firstFew = sortedRegular.slice(0, 5).map(l => {
          const priority = getLocationPriority(l.location, userCity, userCountry);
          return { title: l.title, location: l.location, priority: priority.priority };
        });
        console.log('🔍 DEBUG Sorted listings (first 5):', firstFew);
      }
      
      return [...sortedBoosted, ...sortedRegular];
    }
    
    // Sans localisation: ordre chronologique (plus récent en premier)
    return [...boostedListings, ...regularListings];
  }, [listings, activeBoosts, hasValidLocation, userCity, userCountry]);
  
  const displayedListings = sortedListings;

  console.log('📊 Auth:', isAuthenticated, '| Total listings:', listings?.length, '| Boosted:', activeBoosts.length, '| User location:', userCity, userCountry);

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

  // Helper: Check if listing is less than 24h old
  const isNewListing = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  // Fonction pour déterminer les badges à afficher (max 2, avec priorité)
  const getBadges = (listing: any) => {
    const badges: JSX.Element[] = [];
    
    // 0. Priorité maximale: Badge Boosté pour les annonces en top liste
    if (activeBoosts.includes(listing.id)) {
      badges.push(
        <Badge key="boosted" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white backdrop-blur-sm text-xs font-medium gap-1">
          <Rocket className="h-3 w-3" />
          Top
        </Badge>
      );
    }
    
    // 1. Badge Nouveau pour les annonces < 24h
    if (isNewListing(listing.created_at) && badges.length < 2) {
      badges.push(
        <Badge key="nouveau" className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white backdrop-blur-sm text-xs font-medium gap-1">
          <Sparkles className="h-3 w-3" />
          Nouveau
        </Badge>
      );
    }
    
    // 2. Priorité haute: Badge Gratuit pour les articles à prix 0
    if (listing.price === 0 && badges.length < 2) {
      badges.push(
        <Badge key="gratuit" className="bg-green-500 text-white backdrop-blur-sm text-xs font-medium">
          Gratuit
        </Badge>
      );
    }
    
    // 3. État (condition)
    if (listing.condition && badges.length < 2) {
      badges.push(
        <Badge key="condition" className="bg-accent/90 text-accent-foreground backdrop-blur-sm text-xs font-medium">
          {translateCondition(listing.condition, language)}
        </Badge>
      );
    }
    
    return badges.slice(0, 2); // Maximum 2 badges
  };

  // Handler pour la navigation vers les détails d'une annonce
  const handleListingClick = useCallback((e: React.MouseEvent, listingId: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/listing/${listingId}`);
  }, [navigate]);

  // Fonction de rendu pour une carte d'annonce
  const renderListingCard = (listing: any, index: number) => (
    <GlassCard 
      key={listing.id}
      className="cursor-pointer animate-fade-in group touch-manipulation"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={(e) => handleListingClick(e, listing.id)}
    >
      <div className="aspect-[4/3] bg-muted relative overflow-hidden rounded-t-xl pointer-events-none">
        {listing.images?.[0] ? (
          <img
            src={listing.images[0]}
            alt={`${listing.title} - ${listing.categories?.name || 'produit'} ${listing.condition ? `en état ${translateCondition(listing.condition, language)}` : ''} à ${listing.location} ${listing.price === 0 ? 'gratuit' : `pour ${listing.price} FCFA`}`}
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
      <CardContent className="p-4 pointer-events-none">
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 leading-tight">
          {listing.title}
        </h3>
        <div className="mb-2">
          {listing.price === 0 ? (
            <p className="font-bold text-green-600 text-sm">Gratuit</p>
          ) : (
            <>
              <p className="font-bold text-primary text-sm">
                {formatPriceWithConversion(listing.price, listing.currency || "FCFA", userProfile?.currency || "FCFA")}
              </p>
              {getConvertedPrice(listing.price, listing.currency || "FCFA", userProfile?.currency || "FCFA") && (
                <p className="text-[10px] text-muted-foreground">
                  {getConvertedPrice(listing.price, listing.currency || "FCFA", userProfile?.currency || "FCFA")}
                </p>
              )}
            </>
          )}
        </div>
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
        <div className="text-[10px] text-muted-foreground/60 mt-1.5">
          {formatRelativeTime(listing.created_at)}
        </div>
      </CardContent>
    </GlassCard>
  );

  // Composant skeleton pour le chargement
  const SkeletonCard = () => (
    <Card variant="glass" className="overflow-hidden">
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
