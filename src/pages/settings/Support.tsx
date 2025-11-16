import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MessageCircle, Mail, Phone, Paperclip, Clock, Users } from "lucide-react";
import { toast } from "sonner";

const Support = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Votre message a été envoyé avec succès");
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
          <h1 className="text-lg font-semibold">Contacter le support</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Contact Methods */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <div className="bg-green-500/10 text-green-600 p-3 rounded-full">
                <MessageCircle className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">Chat</span>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <div className="bg-blue-500/10 text-blue-600 p-3 rounded-full">
                <Mail className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">Email</span>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <div className="bg-purple-500/10 text-purple-600 p-3 rounded-full">
                <Phone className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">Appel</span>
            </CardContent>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-orange-500/10 text-orange-600 p-2 rounded-lg">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Temps de réponse</p>
                <p className="text-sm font-semibold">~2 heures</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-blue-500/10 text-blue-600 p-2 rounded-lg">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Disponibilité</p>
                <p className="text-sm font-semibold">7j/7, 8h-20h</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  placeholder="Votre nom"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account">Problème de compte</SelectItem>
                    <SelectItem value="payment">Question de paiement</SelectItem>
                    <SelectItem value="listing">Problème d'annonce</SelectItem>
                    <SelectItem value="technical">Problème technique</SelectItem>
                    <SelectItem value="security">Sécurité</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Sujet</Label>
                <Input
                  id="subject"
                  placeholder="Résumé de votre problème"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Décrivez votre problème en détail..."
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Ajouter des pièces jointes
              </Button>

              <Button type="submit" className="w-full">
                Envoyer le message
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground px-4">
          Notre équipe vous répondra dans les plus brefs délais. Pour les urgences, utilisez le chat en direct.
        </p>
      </div>
    </div>
  );
};

export default Support;
