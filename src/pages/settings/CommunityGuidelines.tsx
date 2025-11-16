import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle, Shield, Users, MessageSquare, Ban } from "lucide-react";

const CommunityGuidelines = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-lg">Règles de la communauté</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Introduction */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-primary/10 text-primary p-2 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-semibold text-lg mb-2">Bienvenue dans notre communauté</h2>
                <p className="text-sm text-muted-foreground">
                  Pour garantir une expérience sûre et agréable pour tous, nous avons établi ces règles. 
                  Le non-respect de ces règles peut entraîner la suppression de contenu ou la suspension de votre compte.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenu interdit */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-destructive/10 text-destructive p-2 rounded-lg">
                <Ban className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-semibold text-lg mb-2">Contenu strictement interdit</h2>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                <span><strong>Articles illégaux ou dangereux :</strong> Armes, drogues, produits contrefaits, substances illicites</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                <span><strong>Contenu violent ou haineux :</strong> Menaces, harcèlement, discrimination, incitation à la haine</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                <span><strong>Contenu sexuel ou obscène :</strong> Nudité, pornographie, contenu à caractère sexuel</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                <span><strong>Spam et fraude :</strong> Escroqueries, pyramide de Ponzi, fausses annonces, phishing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                <span><strong>Violation de propriété intellectuelle :</strong> Articles contrefaits, piratage, utilisation non autorisée de marques</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Bonnes pratiques */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-green-500/10 text-green-600 p-2 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-semibold text-lg mb-2">Bonnes pratiques</h2>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Publiez des photos claires et honnêtes de vos articles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Décrivez précisément l'état et les caractéristiques de vos produits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Fixez des prix justes et raisonnables</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Répondez rapidement aux messages des acheteurs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Soyez respectueux et courtois dans vos échanges</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Respectez vos engagements lors des transactions</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Modération */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-orange-500/10 text-orange-600 p-2 rounded-lg">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-semibold text-lg mb-2">Processus de modération</h2>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <p>
                <strong>Signalement :</strong> Chaque annonce dispose d'un bouton "Signaler" pour alerter notre équipe de modération.
              </p>
              <p>
                <strong>Examen :</strong> Toutes les annonces signalées sont examinées dans les 24-48 heures par notre équipe.
              </p>
              <p>
                <strong>Action :</strong> En cas de violation, nous pouvons supprimer le contenu, avertir l'utilisateur ou suspendre le compte selon la gravité.
              </p>
              <p>
                <strong>Appel :</strong> Vous pouvez contester une décision en contactant notre support.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sanctions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-red-500/10 text-red-600 p-2 rounded-lg">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-semibold text-lg mb-2">Sanctions possibles</h2>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span><strong>Avertissement :</strong> Pour une première infraction mineure</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span><strong>Suppression de contenu :</strong> Retrait immédiat des annonces problématiques</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span><strong>Suspension temporaire :</strong> Blocage du compte pour une durée déterminée</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">•</span>
                <span><strong>Bannissement permanent :</strong> En cas de violations graves ou répétées</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Besoin d'aide ?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Si vous avez des questions sur ces règles ou si vous souhaitez signaler un contenu inapproprié, 
              n'hésitez pas à contacter notre équipe de support.
            </p>
            <Button 
              onClick={() => navigate("/settings/support")}
              className="w-full"
            >
              Contacter le support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunityGuidelines;
