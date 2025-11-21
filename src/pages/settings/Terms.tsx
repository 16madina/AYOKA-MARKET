import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "1. Acceptation des conditions",
      content: "En accédant et en utilisant DJASSA, vous acceptez d'être lié par ces conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service."
    },
    {
      title: "2. Description du service",
      content: "DJASSA est une plateforme de marketplace permettant aux utilisateurs d'acheter et de vendre des articles d'occasion. Nous agissons en tant qu'intermédiaire entre acheteurs et vendeurs. Les transactions financières se font directement entre utilisateurs via cash, Mobile Money ou autres moyens de paiement convenus entre les parties, en dehors de la plateforme."
    },
    {
      title: "3. Inscription et compte utilisateur",
      content: "Pour utiliser certaines fonctionnalités, vous devez créer un compte. Vous êtes responsable de la confidentialité de vos identifiants. Vous devez avoir au moins 18 ans ou avoir l'autorisation parentale. Les informations fournies doivent être exactes et à jour."
    },
    {
      title: "4. Obligations des vendeurs",
      content: "Les vendeurs doivent : publier des annonces honnêtes et précises avec une description minimale de 20 mots, respecter les lois locales, ne pas vendre d'articles interdits (armes, drogues, contrefaçons), honorer les transactions confirmées, et répondre rapidement aux acheteurs."
    },
    {
      title: "5. Obligations des acheteurs",
      content: "Les acheteurs doivent : respecter les vendeurs, payer les articles commandés, ne pas faire de fausses déclarations, et signaler les contenus inappropriés."
    },
    {
      title: "6. Transactions et paiements",
      content: "DJASSA facilite la mise en relation entre acheteurs et vendeurs mais n'est pas partie prenante aux transactions. Les paiements se font directement entre utilisateurs selon les méthodes convenues (espèces, Mobile Money, virement bancaire, etc.) en dehors de la plateforme. DJASSA n'a pas accès aux paiements et n'est pas responsable des litiges financiers entre acheteurs et vendeurs."
    },
    {
      title: "7. Contenus interdits",
      content: "Il est interdit de publier : des articles contrefaits ou volés, des contenus illégaux ou offensants, des armes et substances dangereuses, des animaux vivants (sauf autorisation), et du contenu pornographique."
    },
    {
      title: "8. Propriété intellectuelle",
      content: "Tout le contenu de DJASSA (logo, interface, textes) est protégé par le droit d'auteur. En publiant du contenu, vous accordez à DJASSA une licence d'utilisation. Vous garantissez détenir les droits sur le contenu publié."
    },
    {
      title: "9. Modération et vérification",
      content: "Nous nous réservons le droit de : supprimer tout contenu inapproprié, suspendre ou bannir des comptes en cas de violation, modérer les annonces avant publication. Le badge 'Vendeur vérifié' est attribué aux utilisateurs ayant complété le processus de vérification d'identité (pièce d'identité, email vérifié) et ayant maintenu une bonne réputation (minimum 5 transactions complétées avec note moyenne ≥4/5)."
    },
    {
      title: "10. Limitation de responsabilité",
      content: "DJASSA n'est pas responsable : de la qualité des articles vendus, des litiges entre utilisateurs, des pertes financières, et des dommages indirects. Utilisez le service à vos propres risques."
    },
    {
      title: "11. Protection des données",
      content: "Nous collectons et traitons vos données conformément à notre Politique de confidentialité et au RGPD. Vos données ne seront pas vendues à des tiers."
    },
    {
      title: "12. Modifications des conditions",
      content: "Nous pouvons modifier ces conditions à tout moment. Les utilisateurs seront notifiés des changements importants. Continuer à utiliser le service après modification implique acceptation."
    },
    {
      title: "13. Résiliation",
      content: "Vous pouvez supprimer votre compte à tout moment. Nous pouvons suspendre votre compte en cas de violation. Les obligations contractuelles persistent après résiliation."
    },
    {
      title: "14. Droit applicable et juridiction",
      content: "Ces conditions sont régies par les lois du pays où DJASSA est enregistré. Tout litige sera soumis aux tribunaux compétents de cette juridiction."
    },
    {
      title: "15. Contact",
      content: "Pour toute question concernant ces conditions, contactez-nous via la page 'Contacter le support'."
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
            <h1 className="text-lg font-semibold">Conditions générales</h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Calendar className="h-3 w-3" />
              <span>Dernière mise à jour : 15 janvier 2025</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Card className="mb-6">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Bienvenue sur DJASSA. En utilisant notre plateforme, vous acceptez les conditions générales d'utilisation suivantes. Veuillez les lire attentivement.
            </p>
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

        <Card className="mt-6 bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Note importante :</span> Ces conditions constituent un accord légal entre vous et DJASSA. En continuant à utiliser nos services, vous confirmez avoir lu, compris et accepté ces conditions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
