import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Shield } from "lucide-react";

const Privacy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "1. Introduction",
      content: "DJASSA s'engage à protéger votre vie privée. Cette politique explique comment nous collectons, utilisons et protégeons vos données personnelles conformément au RGPD (Règlement Général sur la Protection des Données)."
    },
    {
      title: "2. Données collectées et géolocalisation",
      content: "Nous collectons : vos informations d'inscription (nom, email, téléphone), les données de profil (photo, localisation ville/pays, préférences), l'historique des transactions et annonces, les messages échangés sur la plateforme, les données de connexion (adresse IP, type d'appareil), et les cookies. IMPORTANT : La géolocalisation est utilisée UNIQUEMENT pour : afficher les annonces proches de votre zone géographique, permettre aux acheteurs de trouver des articles dans leur région, faciliter les rencontres pour les transactions locales. Nous ne partageons JAMAIS votre localisation précise (GPS) avec d'autres utilisateurs, seules votre ville et votre pays sont visibles publiquement."
    },
    {
      title: "3. Utilisation des données",
      content: "Vos données sont utilisées pour : fournir et améliorer nos services, faciliter les transactions entre utilisateurs, envoyer des notifications importantes, personnaliser votre expérience, assurer la sécurité de la plateforme, et respecter nos obligations légales."
    },
    {
      title: "4. Partage des données",
      content: "Nous ne vendons jamais vos données. Nous partageons uniquement : avec d'autres utilisateurs (profil public, annonces), avec nos prestataires de services (paiement, hébergement), avec les autorités si requis par la loi. Toutes les communications sont cryptées."
    },
    {
      title: "5. Protection des données",
      content: "Nous mettons en œuvre des mesures de sécurité : cryptage SSL/TLS pour toutes les communications, stockage sécurisé des mots de passe (hachage), sauvegardes régulières, accès limité aux données personnelles, et surveillance continue des menaces."
    },
    {
      title: "6. Vos droits (RGPD)",
      content: "Vous avez le droit de : accéder à vos données personnelles, corriger les données inexactes, supprimer vos données (droit à l'oubli), limiter le traitement de vos données, vous opposer au traitement, et demander la portabilité de vos données. Contactez-nous pour exercer ces droits."
    },
    {
      title: "7. Cookies",
      content: "Nous utilisons des cookies pour : mémoriser vos préférences, analyser l'utilisation du site, améliorer la performance, et proposer du contenu personnalisé. Vous pouvez désactiver les cookies dans les paramètres de votre navigateur, mais certaines fonctionnalités peuvent être limitées."
    },
    {
      title: "8. Conservation des données",
      content: "Nous conservons vos données : pendant la durée d'activité de votre compte, 3 ans après la dernière connexion (compte inactif), et selon les exigences légales pour les données de transaction. Vous pouvez demander la suppression anticipée."
    },
    {
      title: "9. Données des mineurs",
      content: "Notre service est réservé aux personnes de 18 ans et plus. Si un mineur utilise le service avec autorisation parentale, le parent est responsable de la gestion des données. Nous ne collectons pas sciemment de données d'enfants de moins de 13 ans."
    },
    {
      title: "10. Transferts internationaux",
      content: "Vos données peuvent être transférées vers des serveurs situés dans l'Union Européenne ou des pays offrant un niveau de protection équivalent. Nous prenons toutes les mesures nécessaires pour protéger vos données lors de ces transferts."
    },
    {
      title: "11. Notifications et marketing",
      content: "Vous pouvez gérer vos préférences de notification : dans Paramètres > Notifications. Vous pouvez vous désabonner des emails marketing à tout moment. Les notifications essentielles (sécurité, transactions) ne peuvent pas être désactivées."
    },
    {
      title: "12. Modifications de la politique",
      content: "Nous pouvons modifier cette politique. Les changements importants seront notifiés par email ou via l'application. La date de dernière mise à jour est indiquée en haut de cette page. Continuer à utiliser le service après modification implique acceptation."
    },
    {
      title: "13. Contact DPO",
      content: "Pour toute question sur vos données personnelles, contactez notre Délégué à la Protection des Données (DPO) via la page 'Contacter le support' avec l'objet 'Protection des données'."
    },
    {
      title: "14. Réclamations",
      content: "Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation auprès de l'autorité de protection des données de votre pays."
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3 pt-safe">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Politique de confidentialité</h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Calendar className="h-3 w-3" />
              <span>Dernière mise à jour : 15 janvier 2025</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Card className="mb-6 bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-600 mb-1">Protection RGPD</p>
              <p className="text-muted-foreground">
                Vos données personnelles sont protégées conformément au Règlement Général sur la Protection des Données (RGPD). Vous disposez de droits complets sur vos informations.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <h2 className="font-semibold text-sm mb-2">{section.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-2">🍪 Gestion des cookies</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez gérer vos préférences ci-dessous :
            </p>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Cookies essentiels (obligatoires)
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Cookies de performance
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Cookies marketing
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-green-500/10 border-green-500/20">
          <CardContent className="p-4">
            <p className="text-sm">
              <span className="font-semibold text-foreground">Questions ?</span>
              <span className="text-muted-foreground"> Contactez notre DPO via la page support pour toute question concernant vos données personnelles.</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
