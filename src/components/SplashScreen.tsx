import { useEffect, useState } from "react";
import bazaramSplashLogo from "@/assets/bazaram-splash-logo.png";

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
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-600 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "linear-gradient(135deg, hsl(25, 45%, 35%) 0%, hsl(30, 40%, 50%) 50%, hsl(35, 55%, 55%) 100%)",
        animation: "gradient-shift 6s ease infinite",
      }}
    >
      {/* Formes géométriques animées en arrière-plan */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Cercles flottants */}
        <div 
          className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-warm-gold/10 animate-float"
          style={{ animationDelay: "0s", animationDuration: "4s" }}
        />
        <div 
          className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-warm-terra/10 animate-float"
          style={{ animationDelay: "1s", animationDuration: "5s" }}
        />
        <div 
          className="absolute bottom-1/4 left-1/3 w-24 h-24 rounded-full bg-warm-earth/10 animate-float"
          style={{ animationDelay: "2s", animationDuration: "6s" }}
        />
        
        {/* Formes géométriques tournantes */}
        <div 
          className="absolute top-1/2 right-1/3 w-20 h-20 border-4 border-warm-gold/20 animate-rotate-slow"
          style={{ borderRadius: "30%" }}
        />
        <div 
          className="absolute bottom-1/3 left-1/2 w-16 h-16 border-4 border-warm-terra/20 animate-rotate-slow"
          style={{ animationDirection: "reverse", borderRadius: "20%" }}
        />

        {/* Particules qui montent */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0 w-2 h-2 rounded-full bg-warm-gold/40 animate-particle-rise"
            style={{
              left: `${10 + i * 12}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${6 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-10 relative z-10">
        {/* Logo avec effet bounce et shimmer */}
        <div className="relative animate-slide-up-bounce">
          <div
            className="relative w-80 md:w-96 animate-float"
            style={{ animationDuration: "3s" }}
          >
            {/* Effet shimmer sur le logo */}
            <div
              className="absolute inset-0 rounded-lg"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2.5s ease-in-out infinite",
              }}
            />
            
            <img
              src={bazaramSplashLogo}
              alt="BAZARAM MARKET"
              className="w-full drop-shadow-2xl object-contain relative z-10"
              style={{ 
                imageRendering: 'crisp-edges',
                WebkitFontSmoothing: 'antialiased',
                filter: "drop-shadow(0 0 30px rgba(139, 115, 85, 0.6))"
              }}
            />
            
            {/* Lueur pulsante intense */}
            <div 
              className="absolute inset-0 -z-10 blur-3xl animate-glow-pulse"
              style={{
                background: "radial-gradient(circle, rgba(139, 115, 85, 0.8) 0%, rgba(93, 64, 55, 0.4) 50%, transparent 70%)",
              }}
            />
          </div>
        </div>
        
        {/* Slogan avec animation slide-up */}
        <div 
          className="flex flex-col items-center gap-3 animate-slide-up-bounce"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-warm-gold to-transparent" />
          <p className="text-base md:text-lg text-white/90 text-center px-6 font-medium">
            Donnez une seconde vie à vos articles
          </p>
        </div>

        {/* Barre de progression moderne */}
        <div 
          className="w-64 h-2 bg-white/20 rounded-full overflow-hidden animate-fade-in backdrop-blur-sm"
          style={{ animationDelay: "0.5s" }}
        >
          <div 
            className="h-full rounded-full animate-progress-fill"
            style={{
              background: "linear-gradient(90deg, hsl(35, 55%, 55%) 0%, hsl(30, 40%, 50%) 50%, hsl(25, 45%, 35%) 100%)",
              boxShadow: "0 0 20px rgba(139, 115, 85, 0.8)",
            }}
          />
        </div>
      </div>

      {/* Animation CSS pour le gradient de fond */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
