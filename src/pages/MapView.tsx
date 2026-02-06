import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ListingsMap } from "@/components/map/ListingsMap";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, MapIcon, MapPin, Locate, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { calculateDistance, geocodeLocation, getUserLocation } from "@/utils/distanceCalculation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

// Coordonnées par défaut des pays d'Afrique de l'Ouest
const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  "Côte d'Ivoire": { lat: 5.3600, lng: -4.0083, zoom: 7 },
  "Ivory Coast": { lat: 5.3600, lng: -4.0083, zoom: 7 },
  "Sénégal": { lat: 14.6928, lng: -17.4467, zoom: 7 },
  "Senegal": { lat: 14.6928, lng: -17.4467, zoom: 7 },
  "Mali": { lat: 12.6392, lng: -8.0029, zoom: 6 },
  "Guinée": { lat: 9.6412, lng: -13.5784, zoom: 7 },
  "Guinea": { lat: 9.6412, lng: -13.5784, zoom: 7 },
  "Burkina Faso": { lat: 12.3714, lng: -1.5197, zoom: 7 },
  "Bénin": { lat: 6.3703, lng: 2.3912, zoom: 7 },
  "Benin": { lat: 6.3703, lng: 2.3912, zoom: 7 },
  "Togo": { lat: 6.1375, lng: 1.2123, zoom: 7 },
  "Niger": { lat: 13.5117, lng: 2.1251, zoom: 6 },
  "Ghana": { lat: 5.5600, lng: -0.2057, zoom: 7 },
  "Nigeria": { lat: 6.5244, lng: 3.3792, zoom: 6 },
  "Cameroun": { lat: 3.8480, lng: 11.5021, zoom: 6 },
  "Cameroon": { lat: 3.8480, lng: 11.5021, zoom: 6 },
  "France": { lat: 48.8566, lng: 2.3522, zoom: 6 },
  "Canada": { lat: 45.5017, lng: -73.5673, zoom: 5 },
};

const MapView = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [maxDistance, setMaxDistance] = useState<number>(50); // km
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [distanceFilterEnabled, setDistanceFilterEnabled] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [distanceOpen, setDistanceOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number; zoom: number }>({ 
    lat: 5.3600, 
    lng: -4.0083, 
    zoom: 7 
  });

  // Récupérer le profil de l'utilisateur connecté pour centrer la carte sur son pays
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    staleTime: 0,
  });

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile-for-map", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("city, country")
        .eq("id", session.user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
    staleTime: 0,
  });

  // Déterminer le centre de la carte basé sur le profil ou le GPS
  useEffect(() => {
    const determineMapCenter = async () => {
      // 1. Priorité au profil utilisateur (ville/pays)
      if (userProfile?.country) {
        const countryCoords = COUNTRY_COORDINATES[userProfile.country];
        if (countryCoords) {
          console.log('📍 Map: Centrage sur le pays du profil:', userProfile.country);
          setMapCenter(countryCoords);
          return;
        }
        
        // Si le pays n'est pas dans notre liste, essayer de géocoder
        if (userProfile.city) {
          const coords = await geocodeLocation(`${userProfile.city}, ${userProfile.country}`);
          if (coords) {
            console.log('📍 Map: Centrage géocodé sur:', userProfile.city, userProfile.country);
            setMapCenter({ lat: coords.lat, lng: coords.lng, zoom: 11 });
            return;
          }
        }
      }

      // 2. Fallback: utiliser le GPS du navigateur
      const gpsCoords = await getUserLocation();
      if (gpsCoords) {
        console.log('📍 Map: Centrage sur GPS:', gpsCoords);
        setMapCenter({ lat: gpsCoords.lat, lng: gpsCoords.lng, zoom: 11 });
        setUserLocation(gpsCoords);
        return;
      }

      // 3. Par défaut: Abidjan (déjà défini)
      console.log('📍 Map: Centre par défaut (Abidjan)');
    };

    determineMapCenter();
  }, [userProfile]);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .is("parent_id", null)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Obtenir la position de l'utilisateur
  const handleGetUserLocation = () => {
    setIsLoadingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setDistanceFilterEnabled(true);
          setIsLoadingLocation(false);
          toast.success("Position obtenue");
        },
        (error) => {
          console.error('Erreur géolocalisation:', error);
          toast.error("Impossible d'obtenir votre position");
          setIsLoadingLocation(false);
        }
      );
    } else {
      toast.error("Géolocalisation non disponible");
      setIsLoadingLocation(false);
    }
  };

  const { data: allListings, isLoading } = useQuery({
    queryKey: ["map-listings", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select(`
          *,
          profiles:user_id(full_name, avatar_url),
          categories(name)
        `)
        .eq("status", "active")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);

      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  // Filtrer par distance si activé
  const listings = distanceFilterEnabled && userLocation && allListings
    ? allListings.filter(listing => {
        if (!listing.latitude || !listing.longitude) return false;
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          listing.latitude,
          listing.longitude
        );
        return distance <= maxDistance;
      })
    : allListings;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-20 pt-safe">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg flex items-center gap-2">
                <MapIcon className="h-5 w-5" />
                Carte des annonces
              </h1>
              <p className="text-xs text-muted-foreground">
                {listings?.length || 0} annonces
              </p>
            </div>
          </div>
        </div>

        {/* Filtres compacts en icônes */}
        <div className="px-4 pb-3 flex items-center gap-2">
          {/* Bouton Heatmap */}
          <Button
            variant={heatmapMode ? "default" : "outline"}
            size="sm"
            onClick={() => setHeatmapMode(!heatmapMode)}
            className="h-9"
          >
            <Layers className="h-4 w-4" />
          </Button>

          {/* Bouton Catégories */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Filter className="h-4 w-4" />
                {selectedCategory !== "all" && (
                  <Badge variant="secondary" className="h-5 px-1 text-xs">1</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[400px]">
              <SheetHeader>
                <SheetTitle>Filtrer par catégorie</SheetTitle>
                <SheetDescription>
                  Sélectionnez une catégorie pour filtrer les annonces
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </SheetContent>
          </Sheet>

          {/* Bouton Distance */}
          <Sheet open={distanceOpen} onOpenChange={setDistanceOpen}>
            <SheetTrigger asChild>
              <Button 
                variant={distanceFilterEnabled ? "default" : "outline"} 
                size="sm" 
                className="h-9 gap-2"
              >
                <MapPin className="h-4 w-4" />
                {distanceFilterEnabled && (
                  <span className="text-xs">{maxDistance}km</span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[400px]">
              <SheetHeader>
                <SheetTitle>Filtre par distance</SheetTitle>
                <SheetDescription>
                  Afficher les annonces dans un rayon autour de vous
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {!distanceFilterEnabled ? (
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Activez votre position pour filtrer par distance
                    </p>
                    <Button
                      onClick={handleGetUserLocation}
                      disabled={isLoadingLocation}
                      className="w-full"
                    >
                      <Locate className="h-4 w-4 mr-2" />
                      {isLoadingLocation ? "Chargement..." : "Activer ma position"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Distance maximale</span>
                      <span className="text-lg font-bold text-primary">{maxDistance} km</span>
                    </div>
                    <Slider
                      value={[maxDistance]}
                      onValueChange={(value) => setMaxDistance(value[0])}
                      min={1}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setDistanceFilterEnabled(false)}
                      className="w-full"
                    >
                      Désactiver le filtre
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative pb-20 h-[calc(100vh-180px)]">
        {isLoading ? (
          <div className="absolute inset-0 p-4">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
        ) : listings && listings.length > 0 ? (
          <ListingsMap 
            listings={listings} 
            heatmapMode={heatmapMode}
            centerLat={mapCenter.lat}
            centerLng={mapCenter.lng}
            zoom={mapCenter.zoom}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <Card className="p-8 text-center max-w-md">
              <MapIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg mb-2">Aucune annonce trouvée</h3>
              <p className="text-muted-foreground text-sm">
                Essayez de changer les filtres ou vérifiez plus tard.
              </p>
            </Card>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MapView;
