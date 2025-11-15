import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const RecentListings = () => {
  const { data: listings } = useQuery({
    queryKey: ["recent-listings"],
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
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="py-8 px-4">
      <div className="max-w-screen-xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Toutes les catégories</h2>
        {!listings || listings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Aucune annonce disponible pour le moment</p>
            <p className="text-sm mt-2">Soyez le premier à publier une annonce !</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((listing, index) => (
              <Card 
                key={listing.id} 
                className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in group border-0 shadow-sm"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => window.location.href = `/listing/${listing.id}`}
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {listing.images?.[0] ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Pas d'image
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2 bg-accent/90 text-accent-foreground backdrop-blur-sm text-xs">
                    {listing.condition || "Comme neuf"}
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                    {listing.title}
                  </h3>
                  <p className="font-bold text-primary text-base mb-1">
                    {listing.price === 0 ? (
                      <span className="text-green-600">0 FCFA</span>
                    ) : (
                      `${listing.price.toLocaleString()} FCFA`
                    )}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">{listing.location}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentListings;
