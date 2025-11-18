import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ReportDialogProps {
  listingId: string;
  trigger?: React.ReactNode;
}

const REPORT_REASONS = [
  { value: "inappropriate", label: "Contenu inapproprié" },
  { value: "scam", label: "Arnaque suspectée" },
  { value: "spam", label: "Spam ou publicité" },
  { value: "fake", label: "Produit contrefait" },
  { value: "misleading", label: "Annonce trompeuse" },
  { value: "other", label: "Autre raison" },
];

export const ReportDialog = ({ listingId, trigger }: ReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Veuillez sélectionner une raison");
      return;
    }

    if (description.trim().length < 10) {
      toast.error("Veuillez fournir plus de détails (minimum 10 caractères)");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous devez être connecté pour signaler");
        return;
      }

      const { error } = await supabase.from("reports").insert({
        listing_id: listingId,
        reporter_id: user.id,
        reason,
        description: description.trim(),
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Vous avez déjà signalé cette annonce");
        } else {
          throw error;
        }
      } else {
        toast.success("Signalement envoyé. Nous examinerons cette annonce rapidement.");
        setOpen(false);
        setReason("");
        setDescription("");
      }
    } catch (error) {
      console.error("Error reporting listing:", error);
      toast.error("Erreur lors de l'envoi du signalement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon" className="h-9 w-9">
            <AlertCircle className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaler cette annonce</DialogTitle>
          <DialogDescription>
            Aidez-nous à maintenir une communauté sûre en signalant les annonces inappropriées.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Raison du signalement *</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Détails *</Label>
            <Textarea
              id="description"
              placeholder="Décrivez le problème avec cette annonce..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 caractères (minimum 10)
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Envoi..." : "Envoyer le signalement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
