import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const Report = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: "",
    description: "",
    urgency: "medium"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Votre signalement a été envoyé");
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Signaler un problème</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <Card className="bg-orange-500/10 border-orange-500/20">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-orange-600">Important</p>
              <p className="text-muted-foreground mt-1">
                Les faux signalements peuvent entraîner la suspension de votre compte. Merci de ne signaler que les vrais problèmes.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="type">Type de problème</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type de problème" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">🐛 Bug technique</SelectItem>
                    <SelectItem value="inappropriate">⚠️ Contenu inapproprié</SelectItem>
                    <SelectItem value="fraud">🚨 Fraude / Arnaque</SelectItem>
                    <SelectItem value="spam">📧 Spam</SelectItem>
                    <SelectItem value="harassment">👎 Harcèlement</SelectItem>
                    <SelectItem value="copyright">©️ Violation de droits d'auteur</SelectItem>
                    <SelectItem value="fake">🎭 Faux profil / Fausse annonce</SelectItem>
                    <SelectItem value="other">❓ Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Niveau d'urgence</Label>
                <RadioGroup
                  value={formData.urgency}
                  onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <div>
                          <p className="font-medium">Faible</p>
                          <p className="text-xs text-muted-foreground">Problème mineur</p>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <div>
                          <p className="font-medium">Moyenne</p>
                          <p className="text-xs text-muted-foreground">Nécessite attention</p>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <div>
                          <p className="font-medium">Élevée</p>
                          <p className="text-xs text-muted-foreground">Urgent - danger immédiat</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description détaillée</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez le problème le plus précisément possible..."
                  rows={8}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Plus vous donnez de détails, plus nous pourrons agir rapidement
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Ajouter des captures d'écran
              </Button>

              <Button type="submit" className="w-full" variant="destructive">
                Envoyer le rapport
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground px-4">
          Votre signalement sera examiné par notre équipe sous 24-48h. Pour les urgences, contactez le support directement.
        </p>
      </div>
    </div>
  );
};

export default Report;
