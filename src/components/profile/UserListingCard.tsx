import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface UserListingCardProps {
  listing: any;
  onUpdate: () => void;
}

export const UserListingCard = ({ listing, onUpdate }: UserListingCardProps) => {
  const navigate = useNavigate();
  const isSold = listing.status === "sold";

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) return;

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listing.id);

    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Annonce supprimée");
      onUpdate();
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = isSold ? "active" : "sold";
    const { error } = await supabase
      .from("listings")
      .update({ status: newStatus })
      .eq("id", listing.id);

    if (error) {
      toast.error("Erreur lors de la modification");
    } else {
      toast.success(isSold ? "Annonce réactivée" : "Annonce marquée comme vendue");
      onUpdate();
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* Image */}
        <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
          {listing.images?.[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              Pas d'image
            </div>
          )}
          {isSold && (
            <Badge className="absolute top-1 left-1 bg-yellow-500 text-black text-xs px-1">
              Vendu
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          <h3 className="font-semibold text-sm line-clamp-2">
            {listing.title}
          </h3>
          <p className="text-lg font-bold text-primary">
            {listing.price === 0 ? (
              <span className="text-green-600">Gratuit</span>
            ) : (
              `${listing.price.toLocaleString()} FCFA`
            )}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs py-0">
              {listing.categories?.name}
            </Badge>
            <span>{listing.views === 1 ? "1 vue" : `${listing.views || 0} vues`}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/listing/${listing.id}`)}
            className="h-7 text-xs px-2"
          >
            <Edit className="h-3 w-3 mr-1" />
            Modifier
          </Button>
          
          <Button
            size="sm"
            variant={isSold ? "default" : "secondary"}
            onClick={handleToggleStatus}
            className={`h-7 text-xs px-2 ${isSold ? "" : "bg-orange-500 hover:bg-orange-600 text-white"}`}
          >
            {isSold ? (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Réactiver
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Vendu
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            className="h-7 text-xs px-2"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Supprimer
          </Button>
        </div>
      </div>
    </Card>
  );
};
