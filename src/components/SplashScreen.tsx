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
      }, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background transition-opacity duration-700 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-8 animate-scale-in">
        {/* Logo avec meilleure qualité */}
        <div className="relative">
          <img
            src={djassaLogo}
            alt="DJASSA Market Logo"
            className="w-72 md:w-96 drop-shadow-2xl"
            style={{ 
              imageRendering: 'crisp-edges',
              WebkitFontSmoothing: 'antialiased'
            }}
          />
          {/* Glow effect */}
          <div className="absolute inset-0 blur-3xl bg-primary/20 -z-10 animate-pulse" />
        </div>
        
        {/* Texte net et lisible */}
        <div className="flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            DJASSA
          </h1>
          <p className="text-xl md:text-2xl font-pacifico text-primary">
            Market
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Votre marketplace de confiance
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex gap-2 mt-4 animate-fade-in" style={{ animationDelay: "0.6s" }}>
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0s" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
