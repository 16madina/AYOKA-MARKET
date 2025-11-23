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
import { calculateDistance } from "@/utils/distanceCalculation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const MapView = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [maxDistance, setMaxDistance] = useState<number>(50); // km
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [distanceFilterEnabled, setDistanceFilterEnabled] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState(false);

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
                {listings?.length || 0} annonces disponibles
              </p>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="px-4 pb-4 space-y-3">
          {/* Mode de visualisation */}
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="heatmap-mode" className="text-sm font-medium cursor-pointer">
                  Mode carte de chaleur
                </Label>
              </div>
              <Switch
                id="heatmap-mode"
                checked={heatmapMode}
                onCheckedChange={setHeatmapMode}
              />
            </div>
            {heatmapMode && (
              <p className="text-xs text-muted-foreground mt-2">
                Les zones rouges indiquent une forte concentration d'annonces
              </p>
            )}
          </Card>

          {/* Filtre catégorie */}
          <Card className="p-3">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1">
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
          </Card>

          {/* Filtre distance */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Rayon de recherche</span>
              </div>
              {!distanceFilterEnabled ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGetUserLocation}
                  disabled={isLoadingLocation}
                  className="h-8"
                >
                  <Locate className="h-3 w-3 mr-1" />
                  {isLoadingLocation ? "..." : "Ma position"}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDistanceFilterEnabled(false)}
                  className="h-8 text-xs"
                >
                  Désactiver
                </Button>
              )}
            </div>
            
            {distanceFilterEnabled && userLocation && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Distance max:</span>
                  <span className="font-medium text-primary">{maxDistance} km</span>
                </div>
                <Slider
                  value={[maxDistance]}
                  onValueChange={(value) => setMaxDistance(value[0])}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative pb-20 h-[calc(100vh-180px)]">
        {isLoading ? (
          <div className="absolute inset-0 p-4">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
        ) : listings && listings.length > 0 ? (
          <ListingsMap listings={listings} heatmapMode={heatmapMode} />
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
