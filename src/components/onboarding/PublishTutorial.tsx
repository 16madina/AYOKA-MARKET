import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TutorialStep {
  target: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

const tutorialSteps: TutorialStep[] = [
  {
    target: "title-input",
    title: "Titre accrocheur",
    description: "Soyez précis et descriptif. Incluez la marque, le modèle et l'état de l'article.",
    position: "bottom",
  },
  {
    target: "description-input",
    title: "Description détaillée",
    description: "⚠️ Ne partagez JAMAIS vos coordonnées bancaires ou informations personnelles sensibles dans la description.",
    position: "bottom",
  },
  {
    target: "price-input",
    title: "Prix juste",
    description: "💡 Vérifiez les prix du marché pour des articles similaires. Un prix raisonnable attire plus d'acheteurs.",
    position: "bottom",
  },
  {
    target: "category-select",
    title: "Catégorie appropriée",
    description: "Choisissez la bonne catégorie pour que les acheteurs trouvent facilement votre annonce.",
    position: "bottom",
  },
  {
    target: "location-input",
    title: "Localisation",
    description: "🔒 Indiquez uniquement votre ville ou quartier. Ne partagez jamais votre adresse exacte avant d'avoir rencontré l'acheteur.",
    position: "bottom",
  },
  {
    target: "image-upload",
    title: "Photos de qualité",
    description: "✅ Prenez des photos claires sous un bon éclairage. Montrez l'article sous différents angles. Évitez d'inclure des informations personnelles visibles.",
    position: "top",
  },
];

interface PublishTutorialProps {
  active: boolean;
  onComplete: () => void;
}

export const PublishTutorial = ({ active, onComplete }: PublishTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!active) return;

    const updatePosition = () => {
      const step = tutorialSteps[currentStep];
      const targetElement = document.querySelector(`[data-tutorial="${step.target}"]`);
      
      if (targetElement) {
        setTargetRect(targetElement.getBoundingClientRect());
      } else {
        // If element not found, try next step after a delay
        const timer = setTimeout(() => {
          if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
          } else {
            onComplete();
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [active, currentStep, onComplete]);

  if (!active || !targetRect) return null;

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={handleSkip}
      />

      {/* Highlight */}
      <div
        className="fixed z-50 pointer-events-none transition-all duration-300 animate-pulse"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
          border: "3px solid hsl(var(--primary))",
          borderRadius: "8px",
          boxShadow: "0 0 0 4px hsl(var(--primary) / 0.2)",
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-50 animate-scale-in"
        style={{
          top: step.position === "bottom" 
            ? targetRect.bottom + 12
            : targetRect.top - 200,
          left: Math.min(targetRect.left, window.innerWidth - 340),
          maxWidth: "320px",
        }}
      >
        <div className="bg-background border rounded-lg shadow-lg p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
              <p className="text-xs text-muted-foreground">
                Étape {currentStep + 1} sur {tutorialSteps.length}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Description */}
          <p className="text-sm mb-4 leading-relaxed">
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="flex gap-1.5 mb-4">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === currentStep 
                    ? "flex-1 bg-primary" 
                    : "w-1.5 bg-muted"
                )}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkip}
              className="flex-1"
            >
              Passer
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              className="flex-1"
            >
              {isLastStep ? "Terminer" : "Suivant"}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

