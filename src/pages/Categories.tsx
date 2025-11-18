import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { MessageCircle, Search, ArrowLeft, Grid3x3, List } from "lucide-react";
import * as Icons from "lucide-react";
import { useState } from "react";

// Import des images de fallback
import electroniqueImg from "@/assets/categories/electronique.jpg";
import meublesImg from "@/assets/categories/meubles.jpg";
import vetementsEnfantsImg from "@/assets/categories/vetements-enfants.jpg";
import piecesAutoImg from "@/assets/categories/pieces-auto.jpg";
import maisonCuisineImg from "@/assets/categories/maison-cuisine.jpg";
import articlesSportImg from "@/assets/categories/articles-sport.jpg";
import autresImg from "@/assets/categories/autres.jpg";
import artImg from "@/assets/categories/art.jpg";
import alimentationImg from "@/assets/categories/alimentation.jpg";
import beauteSanteImg from "@/assets/categories/beaute-sante.jpg";
import bricolageImg from "@/assets/categories/bricolage.jpg";
import informatiqueImg from "@/assets/categories/informatique.jpg";
import artCollectionImg from "@/assets/categories/art-collection.jpg";
import sportsLoisirsImg from "@/assets/categories/sports-loisirs.jpg";
import emploiServicesImg from "@/assets/categories/emploi-services.jpg";
import immobilierImg from "@/assets/categories/immobilier.jpg";
import animauxImg from "@/assets/categories/animaux.jpg";
import vehiculesImg from "@/assets/categories/vehicules.jpg";
import gratuitImg from "@/assets/categories/gratuit.jpg";
import loisirsImg from "@/assets/categories/loisirs.jpg";
import servicesImg from "@/assets/categories/services.jpg";

const categoryImages: Record<string, string> = {
  "electronique": electroniqueImg,
  "mode": vetementsEnfantsImg,
  "vehicules": vehiculesImg,
  "maison": maisonCuisineImg,
  "maison-jardin": maisonCuisineImg,
  "loisirs": loisirsImg,
  "services": servicesImg,
  "immobilier": immobilierImg,
  "emploi": emploiServicesImg,
  "emploi-services": emploiServicesImg,
  "alimentation": alimentationImg,
  "beaute-sante": beauteSanteImg,
  "bricolage": bricolageImg,
  "informatique": informatiqueImg,
  "art-collection": artCollectionImg,
  "sports-loisirs": sportsLoisirsImg,
  "animaux": animauxImg,
  "gratuit": gratuitImg,
  "autres": autresImg,
};

const Categories = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: categoriesWithCount, isLoading } = useQuery({
    queryKey: ["categories-with-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select(`
          id,
          name,
          slug,
          icon
        `)
        .is("parent_id", null); // Only get parent categories
      
      if (error) throw error;

      // Get listing counts for each category
      const categoriesWithCounts = await Promise.all(
        data.map(async (category) => {
          const { count } = await supabase
            .from("listings")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id)
            .eq("status", "active");
          
          return {
            ...category,
            count: count || 0,
          };
        })
      );

      // Sort: "Gratuit" first, then by count descending
      const sorted = categoriesWithCounts.sort((a, b) => {
        if (a.slug === "gratuit") return -1;
        if (b.slug === "gratuit") return 1;
        return b.count - a.count;
      });

      return sorted;
    },
  });

  // Filter categories based on search query
  const filteredCategories = categoriesWithCount?.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10 pt-safe">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Catégories</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? <List className="h-5 w-5" /> : <Grid3x3 className="h-5 w-5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => navigate("/messages")}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une catégorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Toutes catégories</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-32 w-full" />
                <div className="p-3">
                  <Skeleton className="h-4 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredCategories && filteredCategories.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredCategories.map((category) => {
                const fallbackImage = categoryImages[category.slug] || autresImg;
                
                return (
                  <Card
                    key={category.id}
                    className="relative overflow-hidden cursor-pointer group hover:scale-105 transition-transform duration-200 shadow-md"
                    onClick={() => navigate(`/categories/${category.slug}`)}
                  >
                    <div className="h-32 relative overflow-hidden">
                      <img 
                        src={fallbackImage} 
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <div className="p-3 bg-background">
                      <p className="text-sm font-medium text-center line-clamp-2">
                        {category.name}
                      </p>
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        {category.count} {category.count === 1 ? 'annonce' : 'annonces'}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCategories.map((category) => {
                const fallbackImage = categoryImages[category.slug] || autresImg;
                
                return (
                  <Card
                    key={category.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/categories/${category.slug}`)}
                  >
                    <div className="flex gap-4 p-4">
                      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                        <img 
                          src={fallbackImage} 
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Explorez les meilleures offres de {category.name.toLowerCase()}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {category.count} {category.count === 1 ? 'annonce' : 'annonces'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Aucune catégorie trouvée
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Categories;
