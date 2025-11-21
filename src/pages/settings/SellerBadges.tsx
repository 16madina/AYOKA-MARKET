import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Shield, Star, Zap, CheckCircle, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SellerBadgesInfo = () => {
  const navigate = useNavigate();

  const badges = [
    {
      icon: Shield,
      name: "Vendeur vérifié",
      color: "bg-blue-600",
      borderColor: "border-blue-500/20",
      bgColor: "bg-blue-500/10",
      criteria: [
        { text: "Email vérifié", required: true },
        { text: "Minimum 5 transactions complétées", required: true },
        { text: "Note moyenne ≥ 4.0/5 étoiles", required: true }
      ],
      benefits: [
        "Profil mis en avant dans les recherches",
        "Augmentation de la confiance des acheteurs",
        "Badge visible sur toutes vos annonces"
      ]
    },
    {
      icon: Star,
      name: "Vendeur étoile",
      color: "bg-gradient-to-r from-yellow-500 to-orange-500",
      borderColor: "border-yellow-500/20",
      bgColor: "bg-yellow-500/10",
      criteria: [
        { text: "Minimum 20 transactions complétées", required: true },
        { text: "Note moyenne ≥ 4.5/5 étoiles", required: true },
        { text: "Taux de réponse ≥ 80%", required: true }
      ],
      benefits: [
        "Profil prioritaire dans les résultats",
        "Badge premium doré très visible",
        "Accès à des fonctionnalités exclusives",
        "Boost automatique de vos annonces"
      ]
    },
    {
      icon: Zap,
      name: "Réponse rapide",
      color: "bg-green-600",
      borderColor: "border-green-500/20",
      bgColor: "bg-green-500/10",
      criteria: [
        { text: "Temps de réponse moyen ≤ 30 minutes", required: true },
        { text: "Taux de réponse ≥ 90%", required: true }
      ],
      benefits: [
        "Badge de réactivité très recherché",
        "Confiance accrue des acheteurs",
        "Meilleures chances de vente rapide"
      ]
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
            <h1 className="text-lg font-semibold">Badges vendeurs</h1>
            <p className="text-xs text-muted-foreground">Devenez un vendeur de confiance</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg mb-2">Système de badges DJASSA</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Les badges sont automatiquement attribués en fonction de vos performances et de votre engagement. 
                  Ils permettent aux acheteurs d'identifier rapidement les vendeurs fiables et réactifs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <Card key={index} className={`${badge.bgColor} ${badge.borderColor}`}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-full ${badge.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{badge.name}</h3>
                      <Badge className={badge.color}>
                        Calcul automatique
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Critères d'obtention
                    </h4>
                    <div className="space-y-2">
                      {badge.criteria.map((criterion, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <div className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-muted-foreground">{criterion.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      Avantages
                    </h4>
                    <ul className="space-y-2">
                      {badge.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary font-bold mt-1">•</span>
                          <span className="text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6 bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-2">💡 Comment obtenir ces badges ?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Les badges sont attribués automatiquement lorsque vous remplissez tous les critères. 
              Vérifiez régulièrement votre profil pour voir votre progression.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>Complétez vos transactions et demandez des avis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>Répondez rapidement aux messages des acheteurs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Maintenez une bonne réputation avec des avis positifs</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-green-500/10 border-green-500/20">
          <CardContent className="p-4">
            <p className="text-sm">
              <span className="font-semibold text-foreground">Transparence totale :</span>
              <span className="text-muted-foreground"> Tous les critères sont publics et le calcul est automatique. Aucune intervention manuelle n'est nécessaire.</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerBadgesInfo;
