import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { formatPriceWithConversion } from "@/utils/currency";

const CategoryDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState<string>("all");

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

  // Get user profile for currency
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("currency")
        .eq("id", session.user.id)
        .single();
      return data;
    },
    enabled: !!session?.user,
  });

  // Check if this is the "Gratuit" category (special handling for free items)
  const isGratuitCategory = slug === "gratuit";

  // Get listings for selected subcategory or parent
  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ["category-listings", activeTab === "all" ? parentCategory?.id : activeTab, isGratuitCategory],
    queryFn: async () => {
      const categoryId = activeTab === "all" ? parentCategory?.id : activeTab;
      if (!categoryId) return [];
      
      // Special case: "Gratuit" category shows ALL listings with price = 0
      if (isGratuitCategory && activeTab === "all") {
        const { data, error } = await supabase
          .from("listings")
          .select(`
            *,
            profiles (
              id,
              full_name,
              avatar_url,
              city
            )
          `)
          .eq("price", 0)
          .eq("status", "active")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        return data;
      }
      
      // Normal case: filter by category
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          profiles (
            id,
            full_name,
            avatar_url,
            city
          )
        `)
        .eq("category_id", categoryId)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!parentCategory?.id,
  });

  const isLoading = parentLoading || subcategoriesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 bg-background">
        <div className="bg-background border-b sticky top-0 z-10 pt-safe">
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
      <div className="bg-background border-b sticky top-0 z-10 pt-safe">
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

      {/* Subcategories Tabs */}
      {subcategories && subcategories.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b bg-background sticky top-[73px] z-10">
            <TabsList className="w-full overflow-x-auto flex-nowrap justify-start h-auto gap-2 bg-transparent p-4">
              <TabsTrigger 
                value="all" 
                className="flex-shrink-0 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Tout
              </TabsTrigger>
              {subcategories.map((subcategory) => (
                <TabsTrigger
                  key={subcategory.id}
                  value={subcategory.id}
                  className="flex-shrink-0 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span className="mr-1">{subcategory.icon}</span>
                  {subcategory.name}
                  {subcategory.count > 0 && (
                    <span className="ml-1 text-xs">({subcategory.count})</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            {/* Listings */}
            <div className="p-4">
              {listingsLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-64 w-full" />
                  ))}
                </div>
              ) : listings && listings.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {listings.map((listing) => (
                    <Card
                      key={listing.id}
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                      onClick={() => navigate(`/listing/${listing.id}`)}
                    >
                      <div className="aspect-square relative overflow-hidden bg-muted">
                        {listing.images?.[0] ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapPin className="h-12 w-12 opacity-20 text-muted-foreground" />
                          </div>
                        )}
                        {listing.condition && (
                          <Badge className="absolute top-2 left-2 bg-accent/90 text-accent-foreground backdrop-blur-sm text-xs">
                            {listing.condition === 'new' ? 'Neuf' : listing.condition === 'like-new' ? 'Comme neuf' : 'Usagé'}
                          </Badge>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-lg text-primary mb-1">
                          {listing.price === 0 
                            ? <span className="text-green-600">Gratuit</span>
                            : formatPriceWithConversion(listing.price, listing.currency || "FCFA", userProfile?.currency || "FCFA")
                          }
                        </p>
                        <p className="text-sm line-clamp-2 mb-1 leading-tight">{listing.title}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">{listing.location}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg">Aucune annonce disponible</p>
                  <p className="text-sm mt-2">Soyez le premier à publier dans cette catégorie</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        /* No subcategories - show listings directly */
        <div className="p-4">
          {listingsLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : listings && listings.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {listings.map((listing) => (
                <Card
                  key={listing.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                  onClick={() => navigate(`/listing/${listing.id}`)}
                >
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    {listing.images?.[0] ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="h-12 w-12 opacity-20 text-muted-foreground" />
                      </div>
                    )}
                    {listing.condition && (
                      <Badge className="absolute top-2 left-2 bg-accent/90 text-accent-foreground backdrop-blur-sm text-xs">
                        {listing.condition === 'new' ? 'Neuf' : listing.condition === 'like-new' ? 'Comme neuf' : 'Usagé'}
                      </Badge>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-lg text-primary mb-1">
                      {listing.price === 0 
                        ? <span className="text-green-600">Gratuit</span>
                        : formatPriceWithConversion(listing.price, listing.currency || "FCFA", userProfile?.currency || "FCFA")
                      }
                    </p>
                    <p className="text-sm line-clamp-2 mb-1 leading-tight">{listing.title}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{listing.location}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">Aucune annonce disponible</p>
              <p className="text-sm mt-2">Soyez le premier à publier dans cette catégorie</p>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default CategoryDetail;
