import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, ShieldCheck, Ban, FileWarning } from "lucide-react";

interface PublicationRulesDialogProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

const prohibitedItems = [
  {
    category: "Contenus interdits",
    icon: Ban,
    items: [
      "Drogues et substances illicites",
      "Armes à feu et munitions",
      "Contrefaçons et produits piratés",
      "Produits volés",
    ],
  },
  {
    category: "Contenus inappropriés",
    icon: AlertTriangle,
    items: [
      "Contenus à caractère sexuel ou violent",
      "Contenus discriminatoires ou haineux",
    ],
  },
];

export function PublicationRulesDialog({
  open,
  onAccept,
  onCancel,
}: PublicationRulesDialogProps) {
  const [confirmations, setConfirmations] = useState({
    readRules: false,
    acceptRules: false,
  });

  const allConfirmed = Object.values(confirmations).every(Boolean);

  const handleConfirmationChange = (key: keyof typeof confirmations) => {
    setConfirmations((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAccept = () => {
    if (allConfirmed) {
      onAccept();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Règles de publication
          </DialogTitle>
          <DialogDescription className="text-sm">
            Veuillez lire et accepter nos règles avant de publier.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-4 px-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 220px)' }}>
          <div className="space-y-4 py-2">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <h3 className="font-semibold text-destructive flex items-center gap-2 mb-2 text-sm">
                <AlertTriangle className="h-4 w-4" />
                Contenus strictement interdits
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                La publication de ces contenus entraînera la suppression de l'annonce et le bannissement du compte.
              </p>

              <div className="space-y-3">
                {prohibitedItems.map((category) => (
                  <div
                    key={category.category}
                    className="bg-background rounded-lg p-2 border"
                  >
                    <h4 className="font-medium text-xs flex items-center gap-1.5 mb-1.5">
                      <category.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {category.category}
                    </h4>
                    <ul className="space-y-0.5">
                      {category.items.slice(0, 3).map((item) => (
                        <li
                          key={item}
                          className="text-xs text-muted-foreground flex items-start gap-1.5"
                        >
                          <span className="text-destructive">•</span>
                          {item}
                        </li>
                      ))}
                      {category.items.length > 3 && (
                        <li className="text-xs text-muted-foreground italic">
                          +{category.items.length - 3} autres...
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <h3 className="font-semibold text-primary flex items-center gap-2 mb-2 text-sm">
                <ShieldCheck className="h-4 w-4" />
                Bonnes pratiques
              </h3>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className="flex items-start gap-1.5">
                  <span className="text-primary">✓</span>
                  Photos réelles de vos articles
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary">✓</span>
                  Description honnête et prix juste
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary">✓</span>
                  Réponse rapide aux messages
                </li>
              </ul>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t pt-4 space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="readRules"
              checked={confirmations.readRules}
              onCheckedChange={() => handleConfirmationChange("readRules")}
            />
            <Label
              htmlFor="readRules"
              className="text-sm font-normal cursor-pointer leading-relaxed"
            >
              J'ai pris connaissance des règles de publication
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="acceptRules"
              checked={confirmations.acceptRules}
              onCheckedChange={() => handleConfirmationChange("acceptRules")}
            />
            <Label
              htmlFor="acceptRules"
              className="text-sm font-normal cursor-pointer leading-relaxed"
            >
              J'accepte de respecter ces règles
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={handleAccept} disabled={!allConfirmed}>
            Accepter et continuer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
