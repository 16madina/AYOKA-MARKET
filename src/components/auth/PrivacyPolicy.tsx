import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacyPolicyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PrivacyPolicy = ({ open, onOpenChange }: PrivacyPolicyProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Politique de confidentialité</DialogTitle>
          <DialogDescription>
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Collecte des informations</h3>
              <p className="text-muted-foreground">
                Nous collectons les informations que vous nous fournissez directement lors de votre inscription, notamment votre nom, prénom, email, numéro de téléphone, pays et ville. Ces informations sont nécessaires pour créer et gérer votre compte DJASSA.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Utilisation des informations</h3>
              <p className="text-muted-foreground">
                Nous utilisons vos informations pour :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Créer et gérer votre compte utilisateur</li>
                <li>Permettre la publication et la gestion de vos annonces</li>
                <li>Faciliter la communication entre acheteurs et vendeurs</li>
                <li>Améliorer nos services et l'expérience utilisateur</li>
                <li>Vous envoyer des notifications importantes concernant votre compte</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Partage des informations</h3>
              <p className="text-muted-foreground">
                Vos informations personnelles ne sont jamais vendues à des tiers. Certaines informations de votre profil (nom, ville, pays) peuvent être visibles par d'autres utilisateurs dans le cadre des transactions sur la plateforme.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Sécurité des données</h3>
              <p className="text-muted-foreground">
                Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos informations personnelles contre tout accès non autorisé, modification, divulgation ou destruction. Vos données sont stockées de manière sécurisée et chiffrées.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Vos droits</h3>
              <p className="text-muted-foreground">
                Vous disposez des droits suivants concernant vos données personnelles :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Droit d'accès à vos données</li>
                <li>Droit de rectification de vos données</li>
                <li>Droit à l'effacement de vos données</li>
                <li>Droit de limitation du traitement</li>
                <li>Droit à la portabilité de vos données</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Conservation des données</h3>
              <p className="text-muted-foreground">
                Nous conservons vos données personnelles aussi longtemps que nécessaire pour :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Maintenir votre compte actif</li>
                <li>Respecter nos obligations légales</li>
                <li>Résoudre les litiges éventuels</li>
                <li>Faire respecter nos accords</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Lorsque vous supprimez votre compte, vos données personnelles sont effacées dans un délai de 30 jours. Les données de transaction peuvent être conservées plus longtemps pour des raisons légales et comptables.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Cookies et technologies similaires</h3>
              <p className="text-muted-foreground">
                Notre plateforme utilise des cookies et technologies similaires pour :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Maintenir votre session active et sécurisée</li>
                <li>Mémoriser vos préférences (langue, mode sombre, etc.)</li>
                <li>Analyser l'utilisation de la plateforme pour l'améliorer</li>
                <li>Assurer le bon fonctionnement des fonctionnalités</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Les cookies essentiels ne peuvent pas être désactivés. Vous pouvez gérer les cookies non essentiels dans les paramètres de votre navigateur.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Transfert international de données</h3>
              <p className="text-muted-foreground">
                Vos données peuvent être transférées et stockées sur des serveurs situés en dehors de votre pays de résidence. Nous nous assurons que ces transferts respectent les normes de protection des données en vigueur, notamment le RGPD pour les résidents européens.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">9. Protection des mineurs</h3>
              <p className="text-muted-foreground">
                DJASSA n'est pas destiné aux personnes de moins de 18 ans. Nous ne collectons pas sciemment d'informations personnelles auprès de mineurs. Si vous pensez qu'un mineur a fourni des informations personnelles, veuillez nous contacter immédiatement.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">10. Conformité iOS et Android</h3>
              <p className="text-muted-foreground">
                Notre application respecte les exigences de confidentialité des plateformes mobiles :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Apple : Transparence du suivi des apps (ATT) - Nous demandons votre autorisation avant tout suivi</li>
                <li>Google : Déclaration de sécurité des données - Toutes les pratiques de collecte sont déclarées</li>
                <li>Accès aux données de l'appareil (photos, caméra, localisation) uniquement avec votre permission explicite</li>
                <li>Aucun partage de données avec des tiers à des fins publicitaires sans consentement</li>
                <li>Chiffrement des données en transit et au repos</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">11. Permissions de l'application</h3>
              <p className="text-muted-foreground">
                DJASSA peut demander les permissions suivantes :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li><strong>Appareil photo/Photos :</strong> Pour ajouter des images à vos annonces</li>
                <li><strong>Localisation :</strong> Utilisée UNIQUEMENT pour afficher les annonces près de vous et faciliter les rencontres locales. Seules votre ville et votre pays sont visibles publiquement, jamais votre localisation précise GPS</li>
                <li><strong>Notifications :</strong> Pour vous informer des messages et activités</li>
                <li><strong>Stockage :</strong> Pour sauvegarder temporairement des images</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Vous pouvez gérer ces permissions à tout moment dans les paramètres de votre appareil.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">12. Modifications de la politique</h3>
              <p className="text-muted-foreground">
                Nous pouvons modifier cette politique de confidentialité à tout moment. Les changements importants seront notifiés par :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Notification dans l'application</li>
                <li>Email à votre adresse enregistrée</li>
                <li>Alerte lors de votre prochaine connexion</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                La date de dernière mise à jour est indiquée en haut de ce document.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">13. Contact et réclamations</h3>
              <p className="text-muted-foreground">
                Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Email : privacy@djassa.com</li>
                <li>Via les paramètres de votre compte</li>
                <li>Centre d'aide dans l'application</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Vous avez également le droit de déposer une réclamation auprès de l'autorité de protection des données de votre pays si vous estimez que vos droits ne sont pas respectés.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
