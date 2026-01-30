import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  SlidersHorizontal, Package, Smartphone, Sofa, Shirt, Car, Home, Briefcase, 
  Dumbbell, Wrench, X, Apple, Dog, Palette, Sparkles, Heart, Monitor, 
  Users, Gift, Gamepad2, TreePine, Cog
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const categories = [
  { name: "Tout", icon: Package, slug: "" },
  { name: "Alimentation", icon: Apple, slug: "alimentation" },
  { name: "Animaux", icon: Dog, slug: "animaux" },
  { name: "Art & Collection", icon: Palette, slug: "art-collection" },
  { name: "Beauté & Santé", icon: Heart, slug: "beaute-sante" },
  { name: "Bricolage", icon: Wrench, slug: "bricolage" },
  { name: "Électronique", icon: Smartphone, slug: "electronique" },
  { name: "Emploi & Services", icon: Users, slug: "emploi-services" },
  { name: "Gratuit", icon: Gift, slug: "gratuit" },
  { name: "Informatique", icon: Monitor, slug: "informatique" },
  { name: "Loisirs", icon: Gamepad2, slug: "loisirs" },
  { name: "Maison & Jardin", icon: TreePine, slug: "maison-jardin" },
  { name: "Meubles", icon: Sofa, slug: "meubles" },
  { name: "Mode", icon: Shirt, slug: "mode" },
  { name: "Pièces Auto", icon: Cog, slug: "pieces-auto" },
  { name: "Services", icon: Briefcase, slug: "services" },
  { name: "Sports & Loisirs", icon: Dumbbell, slug: "sports-loisirs" },
  { name: "Autres", icon: Package, slug: "autres" },
];

const FilterSheet = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [open, setOpen] = useState(false);

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    
    navigate(`/search?${params.toString()}`);
    setOpen(false);
  };

  const handleReset = () => {
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
  };

  // Calculer le nombre de filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    return count;
  }, [selectedCategory, minPrice, maxPrice]);

  // Composant pour afficher les filtres actifs comme chips
  const ActiveFilters = () => {
    if (activeFiltersCount === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedCategory && (
          <Badge variant="secondary" className="gap-1">
            {categories.find(c => c.slug === selectedCategory)?.name}
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => setSelectedCategory("")}
            />
          </Badge>
        )}
        {minPrice && (
          <Badge variant="secondary" className="gap-1">
            Min: {minPrice} FCFA
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => setMinPrice("")}
            />
          </Badge>
        )}
        {maxPrice && (
          <Badge variant="secondary" className="gap-1">
            Max: {maxPrice} FCFA
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => setMaxPrice("")}
            />
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 relative">
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
          {activeFiltersCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Filtres de recherche</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6 pb-20">
          <ActiveFilters />
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Catégories</h3>
            <ScrollArea className="h-48">
              <div className="flex flex-wrap gap-2 pr-4">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategory === category.slug;
                  return (
                    <Button
                      key={category.name}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.slug)}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {category.name}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Fourchette de prix</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minPrice">Prix min</Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="maxPrice">Prix max</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="Illimité"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={handleReset}
            disabled={activeFiltersCount === 0}
          >
            Réinitialiser
          </Button>
          <Button className="flex-1" onClick={handleApplyFilters}>
            Appliquer {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterSheet;
