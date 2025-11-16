import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Sparkles, MapPin } from "lucide-react";
import { getLocationPriority, getLocationBadgeColor } from "@/utils/geographicFiltering";
import { formatPriceWithConversion } from "@/utils/currency";

const RecommendedListings = () => {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("profiles")
        .select("city, country, currency")
        .eq("id", user.id)
        .maybeSingle();
      
      return data;
    },
  });

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["recommendations", user?.id, userProfile?.city, userProfile?.country],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase.functions.invoke("recommend-listings", {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error("Error fetching recommendations:", error);
        return null;
      }

      const recs = data?.recommendations || [];

      // Filtrage post-recommandation : ne garder que les annonces du même pays
      const filteredRecs = recs.filter((listing: any) => {
        const locationInfo = getLocationPriority(
          listing.location,
          userProfile?.city || null,
          userProfile?.country || null
        );
        // Garder uniquement same-city et same-country
        return locationInfo.priority === 'same-city' || locationInfo.priority === 'same-country';
      });

      // Trier par priorité géographique
      const sortedRecs = filteredRecs.sort((a: any, b: any) => {
        const priorityA = getLocationPriority(a.location, userProfile?.city || null, userProfile?.country || null);
        const priorityB = getLocationPriority(b.location, userProfile?.city || null, userProfile?.country || null);
        
        const priorityOrder = {
          'same-city': 0,
          'same-country': 1,
          'neighboring-country': 2,
          'other': 3
        };
        
        return priorityOrder[priorityA.priority] - priorityOrder[priorityB.priority];
      });

      return sortedRecs;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!user || !recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Recommandé pour vous</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="w-full h-48" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {recommendations.map((listing: any) => (
            <Card
              key={listing.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group"
              onClick={() => navigate(`/listing/${listing.id}`)}
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                {listing.images?.[0] ? (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Pas d'image
                  </div>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
                  <Badge className="bg-primary/90 backdrop-blur-sm flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Recommandé
                  </Badge>
                  {(() => {
                    const locationInfo = getLocationPriority(
                      listing.location,
                      userProfile?.city || null,
                      userProfile?.country || null
                    );
                    return (
                      <Badge className={`${getLocationBadgeColor(locationInfo.priority)} backdrop-blur-sm flex items-center gap-1`}>
                        <MapPin className="h-3 w-3" />
                        {locationInfo.distance}
                      </Badge>
                    );
                  })()}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                  {listing.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                  {listing.categories?.name}
                </p>
                <p className="text-xl font-bold text-primary">
                  {formatPriceWithConversion(listing.price, listing.currency || "FCFA", userProfile?.currency || "FCFA")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {listing.location}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecommendedListings;
