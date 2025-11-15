import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-marketplace.jpg";

const HeroSection = () => {
  return (
    <div className="relative h-[400px] md:h-[500px] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
      </div>
      
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Bienvenue sur Revivo
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl">
          Achetez et vendez en toute confiance
        </p>
        
        <div className="w-full max-w-2xl flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher des articles..."
              className="pl-10 h-12 bg-white text-foreground"
            />
          </div>
          <Button className="h-12 px-8">Rechercher</Button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
