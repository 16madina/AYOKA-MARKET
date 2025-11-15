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
    <section className="py-12 px-4 bg-muted/30">
      <div className="max-w-screen-xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">Annonces récentes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings?.map((listing) => (
            <Card key={listing.id} className="overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer">
              <div className="aspect-square bg-muted relative">
                {listing.images?.[0] ? (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
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
                  {listing.price.toLocaleString()} FCFA
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentListings;
