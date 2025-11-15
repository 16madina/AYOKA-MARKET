import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-marketplace.jpg";
import CategoryGrid from "./CategoryGrid";

const HeroSection = () => {
  return (
    <div className="relative pb-8 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${heroImage})`,
          backgroundPosition: 'center center',
          backgroundSize: 'cover'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
      </div>
      
      <div className="relative pt-16 pb-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-fade-in">
            Bienvenue sur Revivo
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Achetez et vendez en toute confiance
          </p>
          
          <div className="w-full max-w-2xl mx-auto flex gap-2 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher des articles..."
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
              Rechercher
            </Button>
          </div>
        </div>
        
        <div className="mt-8">
          <CategoryGrid />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
