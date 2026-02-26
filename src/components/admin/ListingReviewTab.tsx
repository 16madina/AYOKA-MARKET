import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, XCircle, Eye, RefreshCw, AlertTriangle, ExternalLink, Trash2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const ListingReviewTab = () => {
  const queryClient = useQueryClient();
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data: pendingListings, isLoading, refetch } = useQuery({
    queryKey: ["pending-review-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          categories(name),
          profiles(id, full_name, avatar_url, phone)
        `)
        .eq("moderation_status", "pending_review")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleApprove = async (listingId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("listings")
      .update({
        moderation_status: "approved",
        moderated_at: new Date().toISOString(),
        moderated_by: user?.id,
      })
      .eq("id", listingId);

    if (error) {
      toast.error("Erreur lors de l'approbation");
      return;
    }

    toast.success("Annonce approuvée et publiée");
    refetch();
    queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("listings")
      .update({
        moderation_status: "rejected",
        moderated_at: new Date().toISOString(),
        moderated_by: user?.id,
        moderation_notes: rejectNotes,
        status: "inactive",
      })
      .eq("id", rejectingId);

    if (error) {
      toast.error("Erreur lors du rejet");
      return;
    }

    // Notifier l'utilisateur
    const listing = pendingListings?.find(l => l.id === rejectingId);
    if (listing?.user_id) {
      await supabase.from("system_notifications").insert({
        user_id: listing.user_id,
        title: "⚠️ Annonce rejetée",
        message: `${rejectNotes || "Votre annonce ne respecte pas les règles de la plateforme."}\n\nCliquez ici pour republier votre annonce avec une nouvelle image.`,
        notification_type: "moderation",
        metadata: { listing_id: rejectingId, reason: rejectNotes, route: "/publish" },
      });

      // Envoyer aussi une notification push à l'utilisateur
      try {
        await supabase.functions.invoke("send-push-notification", {
          body: {
            userId: listing.user_id,
            title: "⚠️ Annonce rejetée",
            body: rejectNotes || "Votre annonce ne respecte pas les règles. Cliquez pour republier.",
            data: {
              type: "moderation",
              listing_id: rejectingId,
              route: "/publish",
            },
          },
        });
      } catch (pushErr) {
        console.error("Failed to send push notification:", pushErr);
      }
    }

    toast.success("Annonce rejetée");
    setShowRejectDialog(false);
    setRejectNotes("");
    setRejectingId(null);
    refetch();
    queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
  };

  const handleDelete = async (listingId: string) => {
    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success("Annonce supprimée");
    refetch();
  };

  const pendingCount = pendingListings?.length || 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Stats */}
      <Card className="border-amber-500/50">
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-sm sm:text-base">
                {pendingCount} annonce{pendingCount > 1 ? "s" : ""} en attente
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 text-xs sm:text-sm">
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Chargement...</div>
      ) : pendingCount === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
            Aucune annonce en attente de révision
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingListings?.map((listing: any) => (
            <Card key={listing.id} className="border-amber-500/30 overflow-hidden">
              <CardContent className="p-3 sm:p-4">
                <div className="flex gap-3">
                  {/* Images */}
                  <div className="flex flex-col gap-1 shrink-0">
                    {listing.images?.slice(0, 3).map((img: string, idx: number) => (
                      <div
                        key={idx}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted cursor-pointer relative"
                        onClick={() => setPreviewImage(img)}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    ))}
                    {listing.images?.length > 3 && (
                      <span className="text-xs text-muted-foreground text-center">
                        +{listing.images.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm sm:text-base line-clamp-1">{listing.title}</h3>
                      <Badge variant="outline" className="text-amber-600 border-amber-500/50 shrink-0 text-[10px] sm:text-xs">
                        En attente
                      </Badge>
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">
                      {listing.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mb-2 text-xs sm:text-sm">
                      <span className="font-bold">
                        {listing.price === 0 ? "Gratuit" : `${listing.price?.toLocaleString()} ${listing.currency || "FCFA"}`}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{listing.categories?.name}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{listing.location}</span>
                    </div>

                    {/* Seller info */}
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={listing.profiles?.avatar_url || ""} />
                        <AvatarFallback className="text-[8px]">
                          {listing.profiles?.full_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground truncate">
                        {listing.profiles?.full_name || "Inconnu"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale: fr })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleApprove(listing.id)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs"
                        onClick={() => {
                          setRejectingId(listing.id);
                          setShowRejectDialog(true);
                        }}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejeter
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-destructive">
                            <Trash2 className="h-3 w-3 mr-1" />
                            Supprimer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. L'annonce sera supprimée.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(listing.id)}>
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => window.open(`/listing/${listing.id}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Voir
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter l'annonce</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Raison du rejet (sera envoyée à l'utilisateur)..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Aperçu</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="flex justify-center">
              <img src={previewImage} alt="Preview" className="max-h-[60vh] object-contain rounded-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
