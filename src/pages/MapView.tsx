import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ListingsMap } from "@/components/map/ListingsMap";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, MapIcon } from "lucide-react";
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

const MapView = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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

  const { data: listings, isLoading } = useQuery({
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
        <div className="px-4 pb-4">
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
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative pb-20">
        {isLoading ? (
          <div className="absolute inset-0 p-4">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
        ) : listings && listings.length > 0 ? (
          <ListingsMap listings={listings} />
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
