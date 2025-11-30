import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ayokaMarketLogo from "@/assets/ayoka-logo.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useHeroCarousel } from "@/hooks/useHeroCarousel";

const HeroSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { currentImage } = useHeroCarousel();
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  
  // Effet parallaxe au scroll
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.scrollY;
        const heroHeight = heroRef.current.offsetHeight;
        
        // Calculer l'offset parallaxe (mouvement subtil)
        // Le hero bouge plus lentement que le scroll (effet parallaxe)
        const offset = Math.min(scrolled * 0.5, heroHeight * 0.3);
        setParallaxOffset(offset);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return <div ref={heroRef} className="relative h-[400px] md:h-[500px] overflow-hidden">
      {/* Image de fond avec effet parallaxe */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-100 ease-out"
        style={{
          backgroundImage: `url(${currentImage})`,
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          transform: `translateY(${parallaxOffset}px)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-background" />
      </div>
      
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center">
        <div className="flex flex-col items-center animate-fade-in mb-4">
          <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-0">
            Bienvenue sur
          </h1>
          <div className="bg-gradient-to-b from-black/15 via-black/10 to-transparent dark:from-white/15 dark:via-white/8 dark:to-transparent px-4 py-3 rounded-xl backdrop-blur-sm">
            <div className="flex flex-col items-start">
              <img 
                src={ayokaMarketLogo} 
                alt="AYOKA" 
                className="h-32 md:h-56 w-auto object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]"
              />
              <p className="text-4xl md:text-6xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] -mt-2 md:-mt-4 ml-[20%]">
                Market
              </p>
            </div>
          </div>
        </div>
        <p className="text-lg md:text-xl text-white font-semibold mb-8 max-w-2xl animate-fade-in bg-warm-earth/50 backdrop-blur-sm px-6 py-3 rounded-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" style={{
        animationDelay: "0.2s"
      }}>
          {t('hero.subtitle')}
        </p>
        
        <div className="w-full max-w-2xl flex gap-2 animate-fade-in" style={{
        animationDelay: "0.4s"
      }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('hero.search_placeholder')} className="pl-10 h-12 bg-white text-foreground" onKeyDown={e => {
            if (e.key === "Enter" && searchQuery.trim()) {
              navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            }
          }} />
          </div>
          <Button className="h-12 px-8 transition-all duration-300 hover:scale-105" onClick={() => {
          if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
          }
        }}>
            {t('hero.search_button')}
          </Button>
        </div>
      </div>
    </div>;
};
export default HeroSection;