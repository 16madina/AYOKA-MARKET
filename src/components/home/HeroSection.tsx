import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-marketplace-new.jpg";
import bazaramMarketLogo from "@/assets/bazaram-market-logo.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
const HeroSection = () => {
  const {
    t
  } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  return <div className="relative h-[400px] md:h-[500px] overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{
      backgroundImage: `url(${heroImage})`,
      backgroundPosition: 'center center',
      backgroundSize: 'cover'
    }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background" />
      </div>
      
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center">
        <div className="flex flex-col items-center animate-fade-in mb-4">
          <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-2">
            Bienvenue sur
          </h1>
          <img 
            src={bazaramMarketLogo} 
            alt="BAZARAM MARKET" 
            className="h-20 md:h-32 w-auto object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
          />
        </div>
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl animate-fade-in" style={{
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