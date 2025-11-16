import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import * as Icons from "lucide-react";

const CategoryDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams();

  // Get parent category
  const { data: parentCategory, isLoading: parentLoading } = useQuery({
    queryKey: ["parent-category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, icon")
        .eq("slug", slug)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Get subcategories
  const { data: subcategories, isLoading: subcategoriesLoading } = useQuery({
    queryKey: ["subcategories", parentCategory?.id],
    queryFn: async () => {
      if (!parentCategory?.id) return [];
      
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, icon")
        .eq("parent_id", parentCategory.id)
        .order("name");
      
      if (error) throw error;

      // Get listing counts for each subcategory
      const subcategoriesWithCounts = await Promise.all(
        data.map(async (subcategory) => {
          const { count } = await supabase
            .from("listings")
            .select("*", { count: "exact", head: true })
            .eq("category_id", subcategory.id)
            .eq("status", "active");
          
          return {
            ...subcategory,
            count: count || 0,
          };
        })
      );

      return subcategoriesWithCounts;
    },
    enabled: !!parentCategory?.id,
  });

  // Get parent category listing count
  const { data: parentCount } = useQuery({
    queryKey: ["parent-category-count", parentCategory?.id],
    queryFn: async () => {
      if (!parentCategory?.id) return 0;
      
      const { count } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("category_id", parentCategory.id)
        .eq("status", "active");
      
      return count || 0;
    },
    enabled: !!parentCategory?.id,
  });

  const isLoading = parentLoading || subcategoriesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 bg-background">
        <div className="bg-background border-b sticky top-0 z-10">
          <div className="flex items-center gap-4 p-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 flex-1" />
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{parentCategory?.name}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Sous-catégories</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {/* All items in parent category */}
          <Card
            className="relative overflow-hidden cursor-pointer group hover:scale-105 transition-transform duration-200 shadow-md"
            onClick={() => navigate(`/search?category=${parentCategory?.id}`)}
          >
            <div className="h-32 relative overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-bold text-primary">Tout voir</p>
              </div>
            </div>
            <div className="p-3 bg-background">
              <p className="text-sm font-medium text-center">
                Toutes les annonces
              </p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                {parentCount} {parentCount === 1 ? 'annonce' : 'annonces'}
              </p>
            </div>
          </Card>

          {/* Subcategories */}
          {subcategories?.map((subcategory) => {
            const IconComponent = Icons[subcategory.icon as keyof typeof Icons] as any;
            
            return (
              <Card
                key={subcategory.id}
                className="relative overflow-hidden cursor-pointer group hover:scale-105 transition-transform duration-200 shadow-md"
                onClick={() => navigate(`/search?category=${subcategory.id}`)}
              >
                <div className="h-32 relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  {IconComponent && (
                    <IconComponent className="h-16 w-16 text-primary/40 group-hover:text-primary/60 transition-colors" />
                  )}
                </div>
                <div className="p-3 bg-background">
                  <p className="text-sm font-medium text-center line-clamp-2">
                    {subcategory.name}
                  </p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    {subcategory.count} {subcategory.count === 1 ? 'annonce' : 'annonces'}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {subcategories?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Aucune sous-catégorie disponible
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default CategoryDetail;
