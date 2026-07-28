import { useEffect } from "react";
import { ArrowLeft, Shield, AlertTriangle, Ban, Eye, MessageSquare, Users, Scale } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Child Safety / CSAE published standards for Google Play.
 * Play listing title: "AYOKA MARKET, Your Second Life Marketplace"
 * Public URL: https://ayokamarket.com/settings/child-safety
 * Static mirror: https://ayokamarket.com/child-safety-standards.html
 */
const ChildSafety = () => {
  useEffect(() => {
    document.title =
      "Child Safety Standards (CSAE) — AYOKA MARKET, Your Second Life Marketplace";
  }, []);
  const navigate = useNavigate();

  const safetyMeasures = [
    {
      icon: Ban,
      title: "Interdiction absolue des CSAE",
      content:
        "AYOKA MARKET, Your Second Life Marketplace interdit explicitement tout abus sexuel sur des enfants et toute exploitation sexuelle d'enfants (CSAE — Child Sexual Abuse and Exploitation), y compris la production, le partage, la sollicitation, le stockage ou la promotion de contenus pédopornographiques ou d'exploitation sexuelle de mineurs.",
    },
    {
      icon: Scale,
      title: "Normes publiées (Google Play)",
      content:
        "Ces normes publiées s'appliquent à AYOKA MARKET, Your Second Life Marketplace (développeur / fiche Google Play). Toute violation liée aux CSAE entraîne un ban immédiat, la suppression du contenu et, le cas échéant, un signalement aux autorités compétentes.",
    },
    {
      icon: Ban,
      title: "Interdiction aux mineurs",
      content:
        "AYOKA MARKET, Your Second Life Marketplace est réservé aux utilisateurs de 18 ans et plus. L'inscription et l'utilisation par des mineurs sont strictement interdites.",
    },
    {
      icon: Shield,
      title: "Modération du contenu",
      content:
        "Tout contenu publié est soumis à une modération stricte. Les annonces inappropriées, illégales ou liées aux CSAE sont immédiatement supprimées et les comptes concernés sont bannis.",
    },
    {
      icon: AlertTriangle,
      title: "Système de signalement",
      content:
        "Les utilisateurs peuvent signaler tout contenu ou comportement suspect (y compris tout soupçon de CSAE) via le bouton de signalement sur chaque annonce et conversation. Les signalements CSAE sont traités en priorité.",
    },
    {
      icon: Eye,
      title: "Filtrage automatique",
      content:
        "Notre filtrage automatique bloque les termes et motifs inappropriés avant publication, y compris ceux associés à l'exploitation sexuelle de mineurs.",
    },
    {
      icon: Users,
      title: "Blocage des utilisateurs",
      content:
        "Les utilisateurs peuvent bloquer d'autres comptes. Les utilisateurs bloqués ne peuvent plus voir vos annonces ni vous écrire.",
    },
    {
      icon: MessageSquare,
      title: "Messagerie sécurisée",
      content:
        "La messagerie intégrée limite le partage d'informations personnelles sensibles entre acheteurs et vendeurs.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-accent rounded-full transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Normes de sécurité des enfants (CSAE)</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-8 space-y-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Child Safety Standards / Normes CSAE
                </h2>
                <p className="text-muted-foreground">
                  AYOKA MARKET, Your Second Life Marketplace
                </p>
              </div>
            </div>
            <p className="text-foreground/80 leading-relaxed">
              Ces normes publiées s&apos;appliquent à l&apos;application{" "}
              <strong>AYOKA MARKET, Your Second Life Marketplace</strong> telle
              qu&apos;elle apparaît sur Google Play. Elles interdisent
              explicitement les abus sexuels sur des enfants et l&apos;exploitation
              sexuelle d&apos;enfants (CSAE).
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
              <div className="space-y-3">
                <h3 className="font-semibold text-destructive">
                  Interdiction explicite des CSAE
                </h3>
                <p className="text-foreground/80">
                  <strong>
                    AYOKA MARKET, Your Second Life Marketplace interdit
                    formellement :
                  </strong>{" "}
                  tout Child Sexual Abuse and Exploitation (CSAE), tout contenu
                  sexuel impliquant un mineur (réel ou fictif), toute
                  sollicitation sexuelle d&apos;un mineur, et tout trafic ou
                  exploitation sexuelle d&apos;enfants.
                </p>
                <p className="text-foreground/80">
                  <strong>Restriction d&apos;âge :</strong> l&apos;application est
                  réservée aux personnes de 18 ans et plus.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Nos mesures de sécurité</h2>
          {safetyMeasures.map((measure, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-base">
                  <measure.icon className="h-5 w-5 text-primary" />
                  {measure.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {measure.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comment signaler un problème (y compris CSAE) ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-2">
              <li>Bouton « Signaler » sur chaque annonce</li>
              <li>Signalement depuis le menu de la messagerie</li>
              <li>
                Email : <strong>ayokamarket@gmail.com</strong> (objet recommandé :
                « CSAE / Child Safety »)
              </li>
            </ul>
            <p className="text-muted-foreground text-sm">
              Les signalements liés aux CSAE sont traités en priorité. Nous
              pouvons conserver des preuves, suspendre les comptes et coopérer
              avec les autorités lorsque la loi l&apos;exige.
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3">
              Politique de tolérance zéro — AYOKA MARKET, Your Second Life Marketplace
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tolérance zéro envers tout contenu ou comportement illégal,
              offensant, discriminatoire, abusif, frauduleux, violent,
              pornographique, ou constitutif de CSAE. Toute violation entraîne un
              ban définitif.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground text-sm">
              Contact sécurité / CSAE :{" "}
              <strong className="text-foreground">ayokamarket@gmail.com</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Application : AYOKA MARKET, Your Second Life Marketplace · Dernière
              mise à jour :{" "}
              {new Date().toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChildSafety;
