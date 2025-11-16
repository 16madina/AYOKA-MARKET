import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const faqData = {
    compte: [
      {
        question: "Comment créer un compte ?",
        answer: "Pour créer un compte, cliquez sur 'S'inscrire' et remplissez le formulaire avec votre email, nom et mot de passe. Vous recevrez un email de confirmation."
      },
      {
        question: "J'ai oublié mon mot de passe, que faire ?",
        answer: "Cliquez sur 'Mot de passe oublié' sur la page de connexion. Entrez votre email et suivez les instructions pour réinitialiser votre mot de passe."
      },
      {
        question: "Comment vérifier mon compte ?",
        answer: "Allez dans Paramètres > Compte > Vérification du compte. Suivez les étapes pour vérifier votre email et votre numéro de téléphone."
      },
      {
        question: "Comment supprimer mon compte ?",
        answer: "Contactez le support via la page 'Contacter le support' pour demander la suppression de votre compte. Cette action est irréversible."
      }
    ],
    paiement: [
      {
        question: "Quelles méthodes de paiement acceptez-vous ?",
        answer: "Nous acceptons les cartes bancaires, Mobile Money (Orange Money, MTN Money, Moov Money), et les paiements en espèces pour les transactions locales."
      },
      {
        question: "Comment ajouter une méthode de paiement ?",
        answer: "Allez dans Paramètres > Paiements > Méthodes de paiement. Cliquez sur 'Ajouter' et suivez les instructions."
      },
      {
        question: "Les frais de transaction ?",
        answer: "Les frais varient selon la méthode de paiement : 2% pour cartes bancaires, 1% pour Mobile Money. Aucun frais pour les paiements en espèces."
      },
      {
        question: "Où voir mon historique de paiements ?",
        answer: "Consultez votre historique dans Paramètres > Paiements > Historique et facturation."
      }
    ],
    annonces: [
      {
        question: "Comment publier une annonce ?",
        answer: "Cliquez sur le bouton '+' en bas de l'écran, ajoutez des photos, remplissez les détails (titre, prix, description, catégorie) et publiez."
      },
      {
        question: "Combien coûte une annonce ?",
        answer: "Les annonces basiques sont gratuites. Des options payantes (mise en avant, urgence) sont disponibles pour plus de visibilité."
      },
      {
        question: "Combien de temps reste une annonce active ?",
        answer: "Les annonces restent actives pendant 60 jours. Vous pouvez les renouveler gratuitement avant expiration."
      },
      {
        question: "Comment modifier ou supprimer mon annonce ?",
        answer: "Allez sur votre profil, sélectionnez l'annonce, puis choisissez 'Modifier' ou 'Supprimer'."
      },
      {
        question: "Pourquoi mon annonce est en attente de modération ?",
        answer: "Toutes les annonces sont vérifiées sous 24h pour s'assurer qu'elles respectent nos règles (pas de contenu illégal, description claire, photos appropriées)."
      }
    ],
    securite: [
      {
        question: "Comment éviter les arnaques ?",
        answer: "Ne payez jamais avant d'avoir vu l'article. Privilégiez les rencontres en lieux publics. Méfiez-vous des prix trop bas. Ne communiquez pas vos informations bancaires par message."
      },
      {
        question: "Comment signaler un utilisateur suspect ?",
        answer: "Cliquez sur les 3 points sur le profil ou l'annonce, puis 'Signaler'. Décrivez le problème et notre équipe enquêtera."
      },
      {
        question: "Mes données sont-elles protégées ?",
        answer: "Oui, nous utilisons le chiffrement SSL et respectons le RGPD. Consultez notre Politique de confidentialité pour plus de détails."
      },
      {
        question: "Comment activer l'authentification à deux facteurs ?",
        answer: "Allez dans Paramètres > Sécurité > Authentification à deux facteurs et suivez les instructions pour activer cette protection supplémentaire."
      }
    ],
    livraison: [
      {
        question: "Proposez-vous la livraison ?",
        answer: "Les vendeurs peuvent proposer la livraison. Les détails (prix, zones) sont indiqués sur chaque annonce. Contactez le vendeur pour organiser la livraison."
      },
      {
        question: "Comment fonctionne la livraison ?",
        answer: "Le vendeur précise les zones de livraison et les tarifs. Vous convenez ensemble des modalités (date, adresse, mode de paiement)."
      },
      {
        question: "Que faire si je ne reçois pas ma commande ?",
        answer: "Contactez d'abord le vendeur. Si pas de réponse sous 48h, signalez le problème via 'Signaler un problème' avec les détails de votre commande."
      }
    ]
  };

  const filterFAQ = () => {
    if (!searchQuery) return faqData;
    
    const filtered: any = {};
    Object.keys(faqData).forEach((section) => {
      const filteredQuestions = (faqData as any)[section].filter((item: any) =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filteredQuestions.length > 0) {
        filtered[section] = filteredQuestions;
      }
    });
    return filtered;
  };

  const filteredData = filterFAQ();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Questions fréquentes</h1>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher une question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {Object.keys(filteredData).length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucune question ne correspond à votre recherche
          </p>
        ) : (
          <>
            {filteredData.compte && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Compte
                </h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {filteredData.compte.map((item: any, idx: number) => (
                    <AccordionItem
                      key={`compte-${idx}`}
                      value={`compte-${idx}`}
                      className="border rounded-lg px-4 bg-card"
                    >
                      <AccordionTrigger className="text-sm font-medium hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}

            {filteredData.paiement && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Paiement
                </h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {filteredData.paiement.map((item: any, idx: number) => (
                    <AccordionItem
                      key={`paiement-${idx}`}
                      value={`paiement-${idx}`}
                      className="border rounded-lg px-4 bg-card"
                    >
                      <AccordionTrigger className="text-sm font-medium hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}

            {filteredData.annonces && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Annonces
                </h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {filteredData.annonces.map((item: any, idx: number) => (
                    <AccordionItem
                      key={`annonces-${idx}`}
                      value={`annonces-${idx}`}
                      className="border rounded-lg px-4 bg-card"
                    >
                      <AccordionTrigger className="text-sm font-medium hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}

            {filteredData.securite && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Sécurité
                </h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {filteredData.securite.map((item: any, idx: number) => (
                    <AccordionItem
                      key={`securite-${idx}`}
                      value={`securite-${idx}`}
                      className="border rounded-lg px-4 bg-card"
                    >
                      <AccordionTrigger className="text-sm font-medium hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}

            {filteredData.livraison && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Livraison
                </h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {filteredData.livraison.map((item: any, idx: number) => (
                    <AccordionItem
                      key={`livraison-${idx}`}
                      value={`livraison-${idx}`}
                      className="border rounded-lg px-4 bg-card"
                    >
                      <AccordionTrigger className="text-sm font-medium hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FAQ;
