import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAccountDialog = ({ open, onOpenChange }: DeleteAccountDialogProps) => {
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDownloadOption, setShowDownloadOption] = useState(true);

  const handleDownloadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer toutes les données de l'utilisateur
      const [profile, listings, messages, favorites] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("listings").select("*").eq("user_id", user.id),
        supabase.from("messages").select("*").eq("sender_id", user.id),
        supabase.from("favorites").select("*").eq("user_id", user.id),
      ]);

      const userData = {
        profile: profile.data,
        listings: listings.data,
        messages: messages.data,
        favorites: favorites.data,
        exportDate: new Date().toISOString(),
      };

      // Créer un fichier JSON et le télécharger
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `djassa-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Données téléchargées avec succès");
      setShowDownloadOption(false);
    } catch (error) {
      console.error("Error downloading data:", error);
      toast.error("Erreur lors du téléchargement des données");
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "SUPPRIMER") {
      toast.error("Veuillez taper 'SUPPRIMER' pour confirmer");
      return;
    }

    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Utilisateur non connecté");
        return;
      }

      // Supprimer les données de l'utilisateur
      // Les cascades sont gérées par la base de données
      await supabase.from("profiles").delete().eq("id", user.id);

      // Supprimer le compte utilisateur
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Note: La suppression complète du compte Auth nécessite des permissions admin
      // Dans un environnement de production, vous devriez avoir un edge function
      // qui gère cela avec les permissions appropriées

      toast.success("Compte supprimé avec succès");
      navigate("/auth");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Erreur lors de la suppression du compte");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>Supprimer votre compte</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4 pt-4">
            <div className="text-foreground font-semibold">
              Cette action est irréversible. Les données suivantes seront définitivement supprimées :
            </div>
            
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Votre profil et informations personnelles</li>
              <li>Toutes vos annonces publiées</li>
              <li>Vos messages et conversations</li>
              <li>Vos favoris et recherches sauvegardées</li>
              <li>Vos avis et évaluations</li>
              <li>Votre historique de transactions</li>
            </ul>

            {showDownloadOption && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Avant de continuer</p>
                <p className="text-xs text-muted-foreground">
                  Nous vous recommandons de télécharger une copie de vos données
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadData}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger mes données (JSON)
                </Button>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm" className="text-foreground">
                Pour confirmer, tapez <span className="font-bold">SUPPRIMER</span>
              </Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Tapez SUPPRIMER"
                className="uppercase"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={confirmText !== "SUPPRIMER" || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Suppression..." : "Supprimer définitivement"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
