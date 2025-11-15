import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const RecentlyViewed = () => {
  const [viewedIds, setViewedIds] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("recently_viewed");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setViewedIds(parsed.slice(0, 10)); // Keep last 10
      } catch (e) {
        console.error("Error parsing recently viewed:", e);
      }
    }
  }, []);

  const { data: listings } = useQuery({
    queryKey: ["recently-viewed", viewedIds],
    queryFn: async () => {
      if (viewedIds.length === 0) return [];
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          categories (name)
        `)
        .in("id", viewedIds)
        .eq("status", "active");
      if (error) throw error;
      // Sort by viewedIds order
      return viewedIds
        .map((id) => data?.find((listing) => listing.id === id))
        .filter(Boolean);
    },
    enabled: viewedIds.length > 0,
  });

  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <section className="py-8 px-4">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Récemment vus</h2>
        </div>
        
        <Carousel
          opts={{
            align: "start",
            loop: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {listings.map((listing) => (
              <CarouselItem key={listing.id} className="pl-2 md:pl-4 basis-[45%] sm:basis-[30%] md:basis-[23%]">
                <div
                  className="cursor-pointer group"
                  onClick={() => window.location.href = `/listing/${listing.id}`}
                >
                  <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-muted">
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
                  </div>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                    {listing.title}
                  </h3>
                  <p className="font-bold text-primary text-base">
                    {listing.price === 0 ? (
                      <span className="text-green-600">0 FCFA</span>
                    ) : (
                      `${listing.price.toLocaleString()} FCFA`
                    )}
                  </p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
};

export default RecentlyViewed;
