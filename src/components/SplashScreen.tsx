import { useEffect, useState } from "react";
import djassaLogo from "@/assets/djassa-logo.png";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        onFinish();
      }, 600);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 transition-opacity duration-600 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-8">
        {/* Un seul logo avec animation */}
        <div className="relative animate-scale-in">
          <img
            src={djassaLogo}
            alt="DJASSA Market"
            className="w-80 md:w-96 drop-shadow-2xl"
            style={{ 
              imageRendering: 'crisp-edges',
              WebkitFontSmoothing: 'antialiased'
            }}
          />
          {/* Effet de lueur pulsante */}
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 -z-10 animate-pulse" />
        </div>
        
        {/* Slogan qui apparaît après */}
        <div 
          className="flex flex-col items-center gap-3 animate-fade-in"
          style={{ animationDelay: "0.5s" }}
        >
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <p className="text-base md:text-lg text-muted-foreground text-center px-6">
            Donnez une seconde vie à vos articles
          </p>
        </div>

        {/* Indicateur de chargement */}
        <div 
          className="flex gap-2 mt-4 animate-fade-in"
          style={{ animationDelay: "0.8s" }}
        >
          <div 
            className="w-2 h-2 rounded-full bg-primary animate-bounce" 
            style={{ animationDelay: "0s", animationDuration: "0.6s" }} 
          />
          <div 
            className="w-2 h-2 rounded-full bg-primary animate-bounce" 
            style={{ animationDelay: "0.2s", animationDuration: "0.6s" }} 
          />
          <div 
            className="w-2 h-2 rounded-full bg-primary animate-bounce" 
            style={{ animationDelay: "0.4s", animationDuration: "0.6s" }} 
          />
        </div>

        {/* Cercles décoratifs légers en arrière-plan */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-20">
          <div 
            className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-primary/5 animate-pulse"
            style={{ animationDuration: "3s" }}
          />
          <div 
            className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-accent/5 animate-pulse"
            style={{ animationDuration: "4s", animationDelay: "1s" }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
