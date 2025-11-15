import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, Package, Smartphone, Sofa, Shirt, Car, Home, Briefcase, Dumbbell, Book, Gamepad2, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";

const categories = [
  { name: "Tout", icon: Package, slug: "" },
  { name: "Électronique", icon: Smartphone, slug: "electronique" },
  { name: "Meubles", icon: Sofa, slug: "meubles" },
  { name: "Vêtements", icon: Shirt, slug: "pret-porter-homme" },
  { name: "Véhicules", icon: Car, slug: "pieces-auto" },
  { name: "Immobilier", icon: Home, slug: "maison-cuisine" },
  { name: "Services", icon: Briefcase, slug: "autres" },
  { name: "Sport", icon: Dumbbell, slug: "articles-sport" },
  { name: "Livres", icon: Book, slug: "livres-films-musique" },
  { name: "Jouets", icon: Gamepad2, slug: "jeux-jouets" },
  { name: "Outils", icon: Wrench, slug: "bricolage" },
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Filtres</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6 pb-20">
          <div>
            <h3 className="text-lg font-semibold mb-4">Catégories</h3>
            <div className="flex flex-wrap gap-2">
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
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            Réinitialiser
          </Button>
          <Button className="flex-1" onClick={handleApplyFilters}>
            Appliquer
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterSheet;
