import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-marketplace-new.jpg";
import djassaLogo from "@/assets/djassa-hero-logo.png";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
  const { t } = useLanguage();
  
  return (
    <div className="relative h-[400px] md:h-[500px] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${heroImage})`,
          backgroundPosition: 'center center',
          backgroundSize: 'cover'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background" />
      </div>
      
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center">
        <div className="flex flex-col items-center animate-fade-in mb-4">
          <div className="flex items-center gap-2 md:gap-3">
            <h1 className="text-3xl md:text-5xl font-bold text-white">
              Bienvenue au
            </h1>
            <img 
              src={djassaLogo} 
              alt="DJASSA" 
              className="h-10 md:h-16 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            />
          </div>
          <span className="text-xl md:text-3xl font-pacifico text-primary/90 self-end mr-6 md:mr-12">Market</span>
        </div>
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {t('hero.subtitle')}
        </p>
        
        <div className="w-full max-w-2xl flex gap-2 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t('hero.search_placeholder')}
              className="pl-10 h-12 bg-white text-foreground"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const query = (e.target as HTMLInputElement).value;
                  window.location.href = `/search?q=${encodeURIComponent(query)}`;
                }
              }}
            />
          </div>
          <Button 
            className="h-12 px-8 transition-all duration-300 hover:scale-105"
            onClick={() => {
              const input = document.querySelector('input[placeholder="Rechercher des articles..."]') as HTMLInputElement;
              const query = input?.value || "";
              window.location.href = `/search?q=${encodeURIComponent(query)}`;
            }}
          >
            {t('hero.search_button')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
