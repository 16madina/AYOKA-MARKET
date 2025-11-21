import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsConditionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TermsConditions = ({ open, onOpenChange }: TermsConditionsProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Conditions générales d'utilisation</DialogTitle>
          <DialogDescription>
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Acceptation des conditions</h3>
              <p className="text-muted-foreground">
                En vous inscrivant et en utilisant DJASSA, vous acceptez d'être lié par ces conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Description du service</h3>
              <p className="text-muted-foreground">
                DJASSA est une plateforme de petites annonces dédiée à l'économie circulaire, permettant aux utilisateurs de donner une seconde vie à leurs articles. Nous facilitons la mise en relation entre acheteurs et vendeurs pour promouvoir la revente et le réemploi.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Inscription et compte utilisateur</h3>
              <p className="text-muted-foreground">
                Pour utiliser certaines fonctionnalités de DJASSA, vous devez créer un compte. Vous vous engagez à :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Fournir des informations exactes et à jour</li>
                <li>Maintenir la confidentialité de votre mot de passe</li>
                <li>Être responsable de toute activité sur votre compte</li>
                <li>Nous informer immédiatement de toute utilisation non autorisée</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Publication d'annonces</h3>
              <p className="text-muted-foreground">
                Lors de la publication d'une annonce, vous vous engagez à :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Fournir des descriptions exactes et complètes des articles (minimum 20 mots)</li>
                <li>Ne publier que du contenu légal et approprié</li>
                <li>Ne pas publier de contenu offensant, trompeur ou frauduleux</li>
                <li>Respecter les droits de propriété intellectuelle</li>
                <li>Être le propriétaire légitime des articles vendus</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Transactions</h3>
              <p className="text-muted-foreground">
                DJASSA facilite la mise en relation entre acheteurs et vendeurs, mais n'est pas partie aux transactions. Les paiements se font directement entre utilisateurs (espèces, Mobile Money, virement, etc.) en dehors de la plateforme. Les utilisateurs sont responsables de :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>La négociation des prix et conditions</li>
                <li>L'organisation de la livraison ou du retrait</li>
                <li>La vérification de l'état des articles</li>
                <li>Le paiement et la livraison des articles</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Comportements interdits</h3>
              <p className="text-muted-foreground">
                Il est strictement interdit de :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Utiliser la plateforme à des fins frauduleuses ou illégales</li>
                <li>Publier du contenu illégal, offensant, diffamatoire ou discriminatoire</li>
                <li>Harceler, menacer ou intimider d'autres utilisateurs</li>
                <li>Créer plusieurs comptes pour contourner les restrictions</li>
                <li>Utiliser des systèmes automatisés (bots) pour collecter des données</li>
                <li>Vendre des articles contrefaits, volés ou interdits par la loi</li>
                <li>Manipuler les prix ou les évaluations</li>
                <li>Usurper l'identité d'une autre personne ou entité</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Propriété intellectuelle</h3>
              <p className="text-muted-foreground">
                Tout le contenu de DJASSA (logo, design, interface, textes, graphiques, etc.) est protégé par les droits de propriété intellectuelle. Vous ne pouvez pas utiliser, copier, reproduire ou distribuer ce contenu sans autorisation écrite préalable. En publiant du contenu sur DJASSA, vous accordez à la plateforme une licence non exclusive pour afficher et distribuer ce contenu.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Modération et vérification</h3>
              <p className="text-muted-foreground">
                DJASSA se réserve le droit de modérer, modifier ou supprimer tout contenu qui viole ces conditions ou les lois en vigueur. Nous pouvons également suspendre ou supprimer des annonces sans préavis si nécessaire pour protéger la communauté.
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Badge "Vendeur vérifié" :</strong> Ce badge est attribué aux utilisateurs ayant complété le processus de vérification d'identité (pièce d'identité valide, email vérifié) et ayant maintenu une bonne réputation sur la plateforme (minimum 5 transactions complétées avec une note moyenne ≥4/5 étoiles).
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">9. Sécurité des transactions</h3>
              <p className="text-muted-foreground">
                DJASSA recommande fortement de :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Rencontrer les vendeurs dans des lieux publics et sûrs</li>
                <li>Inspecter les articles avant tout paiement</li>
                <li>Ne jamais partager vos informations bancaires par messagerie</li>
                <li>Signaler tout comportement suspect immédiatement</li>
                <li>Utiliser des méthodes de paiement sécurisées</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">10. Résiliation du compte</h3>
              <p className="text-muted-foreground">
                Nous nous réservons le droit de suspendre ou de résilier votre compte à tout moment, sans préavis, en cas de :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Violation de ces conditions d'utilisation</li>
                <li>Activité frauduleuse ou illégale</li>
                <li>Comportement nuisible envers d'autres utilisateurs</li>
                <li>Non-paiement des frais applicables</li>
                <li>Inactivité prolongée du compte</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Vous pouvez également supprimer votre compte à tout moment depuis les paramètres. La suppression entraîne la perte définitive de toutes vos données.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">11. Limitation de responsabilité</h3>
              <p className="text-muted-foreground">
                DJASSA agit uniquement comme intermédiaire entre acheteurs et vendeurs. Nous ne pouvons être tenus responsables de :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>La qualité, la sécurité ou la légalité des articles vendus</li>
                <li>L'exactitude des descriptions fournies par les utilisateurs</li>
                <li>Les dommages directs ou indirects liés aux transactions</li>
                <li>Les pertes financières résultant de fraudes entre utilisateurs</li>
                <li>Les interruptions temporaires du service</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">12. Conformité légale (iOS & Android)</h3>
              <p className="text-muted-foreground">
                Cette application respecte les directives des plateformes :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Apple App Store Guidelines - Conforme aux règles de contenu et de sécurité</li>
                <li>Google Play Store Policies - Respect des politiques de contenu généré par les utilisateurs</li>
                <li>Protection des mineurs - Interdiction aux moins de 18 ans sans autorisation parentale</li>
                <li>Vérification d'âge requise pour certaines catégories de produits</li>
                <li>Signalement et modération du contenu inapproprié</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">13. Achats intégrés et paiements</h3>
              <p className="text-muted-foreground">
                Les transactions sur DJASSA s'effectuent directement entre utilisateurs. Aucun achat intégré n'est effectué via l'App Store ou Google Play. DJASSA peut proposer des services premium (badges vérifiés, mises en avant d'annonces) qui seront clairement indiqués avec leur prix.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">14. Confidentialité et données personnelles</h3>
              <p className="text-muted-foreground">
                L'utilisation de vos données personnelles est régie par notre Politique de Confidentialité. En utilisant DJASSA, vous acceptez notre traitement des données conformément au RGPD et aux lois sur la protection des données applicables.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">15. Modification des conditions</h3>
              <p className="text-muted-foreground">
                Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications importantes seront communiquées par :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Notification dans l'application</li>
                <li>Email à l'adresse enregistrée</li>
                <li>Message lors de votre prochaine connexion</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                L'utilisation continue de la plateforme après modification constitue votre acceptation des nouvelles conditions.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">16. Droit applicable et juridiction</h3>
              <p className="text-muted-foreground">
                Ces conditions sont régies par les lois en vigueur dans votre pays de résidence. Tout litige sera soumis aux tribunaux compétents de votre juridiction.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">17. Contact et support</h3>
              <p className="text-muted-foreground">
                Pour toute question concernant ces conditions d'utilisation, vous pouvez nous contacter via :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Le centre d'aide dans l'application</li>
                <li>Email : support@djassa.com</li>
                <li>Les paramètres de votre compte</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
