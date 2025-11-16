import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Search as SearchIcon, SlidersHorizontal, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import BottomNav from "@/components/BottomNav";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatPrice } from "@/utils/currency";
import { Skeleton } from "@/components/ui/skeleton";

const Search = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    location: searchParams.get("location") || "",
    condition: searchParams.get("condition") || "",
    sortBy: searchParams.get("sortBy") || "recent",
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["search"] });
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
    await queryClient.invalidateQueries({ queryKey: ["userProfile"] });
  };

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("profiles")
        .select("currency")
        .eq("id", user.id)
        .maybeSingle();
      
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: listings, isLoading } = useQuery({
    queryKey: ["search", searchQuery, filters],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select(`
          *,
          profiles:user_id (full_name, avatar_url),
          categories (name)
        `)
        .eq("status", "active");

      // Search query
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Filters
      if (filters.category) {
        query = query.eq("category_id", filters.category);
      }
      if (filters.minPrice) {
        query = query.gte("price", parseInt(filters.minPrice));
      }
      if (filters.maxPrice) {
        query = query.lte("price", parseInt(filters.maxPrice));
      }
      if (filters.location) {
        query = query.ilike("location", `%${filters.location}%`);
      }
      if (filters.condition) {
        query = query.eq("condition", filters.condition);
      }

      // Sorting
      switch (filters.sortBy) {
        case "price_asc":
          query = query.order("price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false });
          break;
        case "popular":
          query = query.order("views", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  };

  const resetFilters = () => {
    setFilters({
      category: "",
      minPrice: "",
      maxPrice: "",
      location: "",
      condition: "",
      sortBy: "recent",
    });
    setSearchParams({});
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen pb-24 bg-background p-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        {/* Search bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Rechercher des articles..."
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>
                <SearchIcon className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filtres</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <Select
                        value={filters.category}
                        onValueChange={(value) =>
                          setFilters({ ...filters, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Toutes</SelectItem>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Prix min (FCFA)</Label>
                        <Input
                          type="number"
                          value={filters.minPrice}
                          onChange={(e) =>
                            setFilters({ ...filters, minPrice: e.target.value })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Prix max (FCFA)</Label>
                        <Input
                          type="number"
                          value={filters.maxPrice}
                          onChange={(e) =>
                            setFilters({ ...filters, maxPrice: e.target.value })
                          }
                          placeholder="1000000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Localisation</Label>
                      <Input
                        value={filters.location}
                        onChange={(e) =>
                          setFilters({ ...filters, location: e.target.value })
                        }
                        placeholder="Ville ou pays"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>État</Label>
                      <Select
                        value={filters.condition}
                        onValueChange={(value) =>
                          setFilters({ ...filters, condition: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tous" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Tous</SelectItem>
                          <SelectItem value="new">Neuf</SelectItem>
                          <SelectItem value="like-new">Comme neuf</SelectItem>
                          <SelectItem value="good">Bon état</SelectItem>
                          <SelectItem value="used">Usagé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Trier par</Label>
                      <Select
                        value={filters.sortBy}
                        onValueChange={(value) =>
                          setFilters({ ...filters, sortBy: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recent">Plus récent</SelectItem>
                          <SelectItem value="price_asc">Prix croissant</SelectItem>
                          <SelectItem value="price_desc">Prix décroissant</SelectItem>
                          <SelectItem value="popular">Populaire</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={handleSearch} className="w-full">
                      Appliquer les filtres
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        {listings && (
          <p className="text-sm text-muted-foreground mb-4">
            {listings.length} résultat{listings.length > 1 ? "s" : ""} trouvé{listings.length > 1 ? "s" : ""}
          </p>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <Skeleton className="aspect-square" />
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-full mb-2" />
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Skeleton className="h-3 w-24" />
                </CardFooter>
              </Card>
            ))
          ) : (
            listings?.map((listing, index) => (
              <Card
                key={listing.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => (window.location.href = `/listing/${listing.id}`)}
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {listing.images?.[0] ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Pas d'image
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                    {listing.categories?.name}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {listing.title}
                  </h3>
                  <p className="text-2xl font-bold text-primary mb-2">
                    {listing.price === 0 ? (
                      <span className="text-green-600">Gratuit</span>
                    ) : (
                      formatPrice(listing.price, userProfile?.currency || "FCFA")
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{listing.location}</span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(listing.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {!isLoading && (!listings || listings.length === 0) && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Aucun résultat trouvé</p>
            <p className="text-sm text-muted-foreground mt-2">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        )}
      </div>
      <BottomNav />
    </PullToRefresh>
  );
};

export default Search;
