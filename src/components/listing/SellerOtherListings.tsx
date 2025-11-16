import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice } from "@/utils/currency";

interface SellerOtherListingsProps {
  userId: string;
  currentListingId: string;
  userCurrency?: string;
}

export const SellerOtherListings = ({ 
  userId, 
  currentListingId,
  userCurrency = "FCFA" 
}: SellerOtherListingsProps) => {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["seller-other-listings", userId, currentListingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          categories (name)
        `)
        .eq("user_id", userId)
        .eq("status", "active")
        .neq("id", currentListingId)
        .order("created_at", { ascending: false })
        .limit(2);
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !listings || listings.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Autres annonces du vendeur</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              to={`/listing/${listing.id}`}
              className="flex flex-col gap-2 rounded-lg hover:bg-muted/50 transition-colors group p-2"
            >
            <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden bg-muted">
              {listing.images?.[0] ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {listing.title}
              </h4>
              <p className="text-primary font-bold text-sm">
                {listing.price === 0 ? (
                  <span className="text-green-600">Gratuit</span>
                ) : (
                  formatPrice(listing.price, userCurrency)
                )}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{listing.location}</span>
              </div>
            </div>
            </Link>
          ))}
        </div>
        <Link
          to={`/seller/${userId}`}
          className="block text-center text-sm text-primary hover:underline font-medium pt-2 border-t"
        >
          Voir toutes les annonces →
        </Link>
      </CardContent>
    </Card>
  );
};
