import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, MessageCircle, Mail } from "lucide-react";

const Help = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "Comment créer un compte ?",
      answer: "Cliquez sur 'S'inscrire' depuis la page d'accueil. Remplissez vos informations (nom, prénom, email, téléphone, pays, ville) et créez un mot de passe sécurisé. Vous recevrez un email de confirmation pour activer votre compte."
    },
    {
      question: "Comment publier une annonce ?",
      answer: "Cliquez sur le bouton '+' en bas de l'écran. Remplissez tous les champs obligatoires : titre, catégorie, prix, état, description et localisation. Ajoutez entre 1 et 8 photos de qualité. Vérifiez les informations et publiez. Votre annonce sera modérée puis publiée sous 24h maximum."
    },
    {
      question: "Comment prendre de bonnes photos ?",
      answer: "Utilisez un bon éclairage naturel, nettoyez l'article avant la photo, prenez plusieurs angles (face, profil, détails), montrez les défauts éventuels, évitez les arrière-plans encombrés. Les annonces avec des photos de qualité reçoivent 3 fois plus de réponses."
    },
    {
      question: "Comment contacter un vendeur ?",
      answer: "Sur la page de l'annonce, cliquez sur 'Contacter le vendeur'. Rédigez votre message en étant poli et précis. Le vendeur recevra une notification et pourra vous répondre. Vous pouvez négocier le prix, poser des questions et organiser la rencontre via la messagerie."
    },
    {
      question: "Comment négocier un prix ?",
      answer: "Dans la conversation, cliquez sur l'icône 'Faire une offre' pour proposer un nouveau prix. Le vendeur peut accepter, refuser ou faire une contre-offre. Soyez respectueux et raisonnable dans vos propositions. Environ 60% des articles sont vendus avec une négociation."
    },
    {
      question: "Comment sécuriser mes transactions ?",
      answer: "TOUJOURS rencontrer dans un lieu public (café, centre commercial, parking éclairé). Ne jamais donner vos coordonnées bancaires par message. Inspecter l'article avant de payer. Privilégier le paiement en espèces ou par virement sécurisé. Signaler tout comportement suspect immédiatement."
    },
    {
      question: "Comment modifier mon profil ?",
      answer: "Allez dans Profil > Paramètres > Modifier le profil. Vous pouvez changer votre photo, votre nom, prénom, téléphone, ville et pays. Les modifications de l'email nécessitent une vérification. Pensez à compléter votre profil pour inspirer confiance aux acheteurs."
    },
    {
      question: "Que faire en cas d'annonce suspecte ?",
      answer: "Sur la page de l'annonce, cliquez sur les trois points (⋮) en haut à droite et sélectionnez 'Signaler'. Choisissez la raison : arnaque, contenu inapproprié, article contrefait, spam, etc. Notre équipe examine tous les signalements sous 24h et prend les mesures nécessaires."
    },
    {
      question: "Comment supprimer mon annonce ?",
      answer: "Allez dans votre Profil > Mes annonces. Cliquez sur l'annonce à supprimer > trois points > 'Supprimer l'annonce'. Confirmez la suppression. Cette action est irréversible. Vous pouvez aussi marquer une annonce comme 'Vendue' pour la désactiver sans la supprimer."
    },
    {
      question: "Comment marquer un article comme vendu ?",
      answer: "Dans Profil > Mes annonces, sélectionnez l'annonce vendue, cliquez sur 'Marquer comme vendu'. Cela désactive l'annonce et permet aux acheteurs de savoir qu'elle n'est plus disponible. Vous pouvez ensuite laisser un avis sur l'acheteur."
    },
    {
      question: "Pourquoi mon annonce a été refusée ?",
      answer: "Les raisons courantes : photos de mauvaise qualité, description trop courte, article interdit (armes, tabac, médicaments), prix non réaliste, contenu inapproprié. Vous recevez un email explicatif. Vous pouvez corriger et republier. Consultez nos règles de publication dans les paramètres."
    },
    {
      question: "Comment rechercher efficacement ?",
      answer: "Utilisez des mots-clés précis, filtrez par catégorie, prix, localisation et état. Triez les résultats par pertinence, date ou prix. Sauvegardez vos recherches favorites pour recevoir des alertes. Activez les notifications pour les nouvelles annonces correspondant à vos critères."
    },
    {
      question: "Comment ajouter aux favoris ?",
      answer: "Sur n'importe quelle annonce, cliquez sur l'icône cœur (♡) en haut à droite. L'annonce sera sauvegardée dans Profil > Favoris. Vous recevrez une notification si le prix baisse ou si l'annonce est sur le point d'expirer. Vous pouvez organiser vos favoris par dossiers."
    },
    {
      question: "Comment suivre un vendeur ?",
      answer: "Sur le profil du vendeur, cliquez sur 'Suivre'. Vous serez notifié quand il publie de nouvelles annonces. Pratique pour les vendeurs professionnels ou les boutiques que vous appréciez. Gérez vos abonnements dans Profil > Abonnements."
    },
    {
      question: "Comment laisser un avis ?",
      answer: "Après une transaction, vous recevrez une invitation à laisser un avis. Allez dans Profil > Mes transactions, sélectionnez la transaction et cliquez sur 'Laisser un avis'. Notez l'utilisateur sur 5 étoiles et laissez un commentaire constructif. Les avis sont publics et définitifs."
    },
    {
      question: "Pourquoi vérifier son compte ?",
      answer: "Un compte vérifié inspire plus de confiance. Vous obtenez un badge bleu, vos annonces sont mieux classées, vous recevez plus de réponses. Pour vérifier : Paramètres > Vérification du compte. Suivez les étapes (vérification email, téléphone, et optionnellement pièce d'identité)."
    },
    {
      question: "Comment gérer mes notifications ?",
      answer: "Allez dans Paramètres > Notifications. Personnalisez : messages, offres, favoris, suivis, promotions. Choisissez le canal (push, email, SMS). Réglez la fréquence (instantané, résumé quotidien, hebdomadaire). Désactivez les notifications non essentielles pour éviter la saturation."
    },
    {
      question: "Comment bloquer un utilisateur ?",
      answer: "Sur le profil de l'utilisateur ou dans une conversation, cliquez sur les trois points > 'Bloquer'. L'utilisateur ne pourra plus vous contacter ni voir vos annonces. Vous ne verrez plus ses annonces non plus. Gérez vos blocages dans Paramètres > Utilisateurs bloqués."
    },
    {
      question: "Comment supprimer mon compte ?",
      answer: "Allez dans Paramètres > Gérer le compte > Supprimer mon compte. Téléchargez d'abord vos données si nécessaire. Confirmez en tapant 'SUPPRIMER'. ATTENTION : Cette action est définitive. Toutes vos annonces, messages et données seront supprimés dans 30 jours."
    },
    {
      question: "Comment signaler un problème technique ?",
      answer: "Contactez-nous via le Centre d'aide > Email ou Chat. Décrivez le problème avec le maximum de détails : appareil, système d'exploitation, version de l'app, actions effectuées, captures d'écran si possible. Notre équipe technique répond sous 48h maximum."
    },
    {
      question: "Les frais et commissions",
      answer: "La publication d'annonces est GRATUITE. DJASSA ne prend AUCUNE commission sur les ventes. Des services premium optionnels existent : mise en avant d'annonces, badge professionnel, statistiques avancées. Les prix sont clairement affichés avant tout achat."
    },
    {
      question: "Puis-je vendre professionnellement ?",
      answer: "Oui ! Passez en compte Pro dans Paramètres > Type de compte. Vous bénéficiez de : statistiques détaillées, gestion multi-annonces, badge professionnel, réponses automatiques, délais de livraison. Abonnement mensuel, premier mois gratuit."
    },
    {
      question: "Comment récupérer mon mot de passe ?",
      answer: "Sur la page de connexion, cliquez sur 'Mot de passe oublié ?'. Entrez votre email. Vous recevrez un lien de réinitialisation valable 1h. Créez un nouveau mot de passe sécurisé (8 caractères min, majuscules, chiffres, symboles). Si vous ne recevez pas l'email, vérifiez vos spams."
    },
    {
      question: "Puis-je modifier une annonce publiée ?",
      answer: "Oui, dans Profil > Mes annonces > Modifier. Vous pouvez changer le titre, prix, description, photos et localisation. Les modifications importantes peuvent nécessiter une nouvelle modération. Vous ne pouvez pas changer la catégorie : il faut supprimer et republier."
    },
    {
      question: "Comment fonctionne la messagerie ?",
      answer: "La messagerie est intégrée à l'app. Vous pouvez envoyer des messages texte, photos, votre localisation et des offres de prix. Les conversations sont organisées par annonce. Activez les notifications pour ne manquer aucun message. L'historique est conservé 1 an."
    }
  ];

  return (
    <div className="min-h-screen pb-24 bg-background">
      <div className="bg-background border-b sticky top-0 z-10 pt-safe">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-lg">Centre d'aide</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Questions fréquentes</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Guides pratiques</h2>
          <div className="space-y-3">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium mb-2">🎯 Bien démarrer sur DJASSA</h3>
              <p className="text-sm text-muted-foreground">
                Créez votre compte, complétez votre profil, publiez votre première annonce et découvrez toutes les fonctionnalités en 5 minutes.
              </p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium mb-2">💰 Conseils pour vendre rapidement</h3>
              <p className="text-sm text-muted-foreground">
                Photos de qualité, description détaillée, prix juste, réponse rapide aux messages. Une annonce bien rédigée se vend 5x plus vite.
              </p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium mb-2">🛡️ Règles de sécurité essentielles</h3>
              <p className="text-sm text-muted-foreground">
                Lieu public pour les rencontres, inspection avant paiement, pas de coordonnées bancaires par message, signalement des comportements suspects.
              </p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium mb-2">⭐ Optimiser votre profil vendeur</h3>
              <p className="text-sm text-muted-foreground">
                Photo de profil, description complète, vérification du compte, réponse rapide, bonnes évaluations. Un profil complet augmente vos ventes de 70%.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Catégories populaires</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-sm font-medium">📱 Électronique</p>
              <p className="text-xs text-muted-foreground mt-1">Smartphones, tablettes, PC</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-sm font-medium">🪑 Meubles</p>
              <p className="text-xs text-muted-foreground mt-1">Mobilier et décoration</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-sm font-medium">👕 Vêtements</p>
              <p className="text-xs text-muted-foreground mt-1">Mode homme, femme, enfant</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-sm font-medium">🏠 Maison</p>
              <p className="text-xs text-muted-foreground mt-1">Électroménager, cuisine</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Statistiques & Transparence</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Temps de réponse moyen</span>
              <span className="font-semibold">&lt; 2h</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Taux de satisfaction</span>
              <span className="font-semibold">96%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Transactions sécurisées</span>
              <span className="font-semibold">99.8%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Utilisateurs actifs</span>
              <span className="font-semibold">50K+</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Nous contacter</h2>
          <p className="text-sm text-muted-foreground">
            Vous ne trouvez pas la réponse à votre question ? Notre équipe de support est disponible 7j/7.
          </p>
          
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-3">
              <MessageCircle className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Chat en direct</div>
                <div className="text-xs text-muted-foreground">Réponse en quelques minutes • Disponible 9h-21h</div>
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-start gap-3">
              <Mail className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Email</div>
                <div className="text-xs text-muted-foreground">support@djassamarket.com • Réponse sous 24h</div>
              </div>
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Suivez-nous sur les réseaux sociaux pour les dernières actualités et conseils
            </p>
          </div>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
};

export default Help;
