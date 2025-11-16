import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Search, MessageSquare, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingWelcomeProps {
  open: boolean;
  onComplete: () => void;
}

const slides = [
  {
    icon: Shield,
    title: "Bienvenue sur Djassa",
    description: "Votre marketplace de confiance pour acheter et vendre en toute sécurité en Afrique de l'Ouest.",
    tip: "Plus de 10 000 annonces actives dans votre région",
    color: "bg-primary",
  },
  {
    icon: Search,
    title: "Trouvez ce que vous cherchez",
    description: "Parcourez des milliers d'articles dans toutes les catégories. Utilisez les filtres pour affiner votre recherche.",
    tip: "💡 Activez les notifications pour ne rien manquer",
    color: "bg-blue-500",
  },
  {
    icon: MessageSquare,
    title: "Communiquez en toute sécurité",
    description: "Contactez les vendeurs directement via notre messagerie sécurisée. Négociez les prix et organisez les rencontres.",
    tip: "🔒 Ne partagez jamais vos coordonnées bancaires par message",
    color: "bg-green-500",
  },
  {
    icon: CheckCircle,
    title: "Vendez facilement",
    description: "Publiez vos annonces en quelques clics. Photos claires, description détaillée et prix juste = vente rapide !",
    tip: "⚠️ Suivez nos règles de la communauté pour éviter les sanctions",
    color: "bg-orange-500",
  },
];

export const OnboardingWelcome = ({ open, onComplete }: OnboardingWelcomeProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const isLastSlide = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        {/* Header with skip button */}
        <div className="flex justify-end p-4 pb-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Passer
          </Button>
        </div>

        {/* Slide content */}
        <div className="p-8 pt-4 flex flex-col items-center text-center">
          {/* Icon */}
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-scale-in",
            slide.color,
            "bg-opacity-10"
          )}>
            <Icon className={cn("h-10 w-10", slide.color.replace('bg-', 'text-'))} />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-3 animate-fade-in">
            {slide.title}
          </h2>

          {/* Description */}
          <p className="text-muted-foreground mb-4 animate-fade-in">
            {slide.description}
          </p>

          {/* Tip */}
          <div className="bg-muted/50 rounded-lg p-3 mb-6 animate-fade-in">
            <p className="text-sm font-medium">
              {slide.tip}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2 mb-6">
            {slides.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentSlide 
                    ? "w-8 bg-primary" 
                    : "w-2 bg-muted"
                )}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3 w-full">
            {currentSlide > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={cn(
                "flex-1",
                currentSlide === 0 && "w-full"
              )}
            >
              {isLastSlide ? "Commencer" : "Suivant"}
              {!isLastSlide && <ChevronRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
