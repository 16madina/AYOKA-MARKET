import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Gift, 
  Landmark, 
  Palette, 
  Settings, 
  Baby, 
  Book, 
  Smartphone, 
  Sofa, 
  ShoppingCart, 
  Sparkles, 
  Home, 
  Wrench, 
  Watch, 
  Shirt, 
  Briefcase, 
  Dumbbell, 
  Music, 
  Trees, 
  PawPrint, 
  Gamepad2,
  MoreHorizontal,
  MessageCircle,
  Search,
  Bell,
  Share2
} from "lucide-react";

const categories = [
  { 
    name: "Gratuit", 
    icon: Gift, 
    gradient: "from-green-400 to-emerald-600",
    slug: "gratuit"
  },
  { 
    name: "Antiquités et objets de collection", 
    icon: Landmark, 
    gradient: "from-amber-400 to-orange-600",
    slug: "antiquites"
  },
  { 
    name: "Art et artisanat", 
    icon: Palette, 
    gradient: "from-purple-400 to-pink-600",
    slug: "art"
  },
  { 
    name: "Pièces automobiles", 
    icon: Settings, 
    gradient: "from-slate-400 to-slate-600",
    slug: "pieces-auto"
  },
  { 
    name: "Bébés", 
    icon: Baby, 
    gradient: "from-pink-300 to-pink-500",
    slug: "bebes"
  },
  { 
    name: "Livres, films et musique", 
    icon: Book, 
    gradient: "from-blue-400 to-blue-600",
    slug: "livres-films-musique"
  },
  { 
    name: "Appareils électroniques", 
    icon: Smartphone, 
    gradient: "from-indigo-400 to-indigo-600",
    slug: "electronique"
  },
  { 
    name: "Meubles", 
    icon: Sofa, 
    gradient: "from-brown-400 to-brown-600",
    slug: "meubles"
  },
  { 
    name: "Vide-grenier", 
    icon: ShoppingCart, 
    gradient: "from-teal-400 to-teal-600",
    slug: "vide-grenier"
  },
  { 
    name: "Santé et beauté", 
    icon: Sparkles, 
    gradient: "from-rose-400 to-rose-600",
    slug: "sante-beaute"
  },
  { 
    name: "Maison et cuisine", 
    icon: Home, 
    gradient: "from-yellow-400 to-yellow-600",
    slug: "maison-cuisine"
  },
  { 
    name: "Bricolage", 
    icon: Wrench, 
    gradient: "from-orange-400 to-orange-600",
    slug: "bricolage"
  },
  { 
    name: "Bijoux et montres", 
    icon: Watch, 
    gradient: "from-cyan-400 to-cyan-600",
    slug: "bijoux-montres"
  },
  { 
    name: "Vêtements pour enfants et bébés", 
    icon: Shirt, 
    gradient: "from-lime-400 to-lime-600",
    slug: "vetements-enfants"
  },
  { 
    name: "Bagages et sacs", 
    icon: Briefcase, 
    gradient: "from-gray-400 to-gray-600",
    slug: "bagages-sacs"
  },
  { 
    name: "Prêt à porter homme", 
    icon: Shirt, 
    gradient: "from-sky-400 to-sky-600",
    slug: "pret-porter-homme"
  },
  { 
    name: "Instruments de musique", 
    icon: Music, 
    gradient: "from-violet-400 to-violet-600",
    slug: "instruments-musique"
  },
  { 
    name: "Patio et jardin", 
    icon: Trees, 
    gradient: "from-green-500 to-green-700",
    slug: "patio-jardin"
  },
  { 
    name: "Produits pour animaux", 
    icon: PawPrint, 
    gradient: "from-amber-500 to-amber-700",
    slug: "produits-animaux"
  },
  { 
    name: "Articles de sport", 
    icon: Dumbbell, 
    gradient: "from-red-400 to-red-600",
    slug: "articles-sport"
  },
  { 
    name: "Jeux et jouets", 
    icon: Gamepad2, 
    gradient: "from-fuchsia-400 to-fuchsia-600",
    slug: "jeux-jouets"
  },
  { 
    name: "Autres", 
    icon: MoreHorizontal, 
    gradient: "from-neutral-400 to-neutral-600",
    slug: "autres"
  },
];

const Categories = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <MessageCircle className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </Button>
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button className="flex-1 py-3 text-center text-muted-foreground hover:text-foreground">
            Vendre
          </button>
          <button className="flex-1 py-3 text-center text-muted-foreground hover:text-foreground">
            Pour vous
          </button>
          <button className="flex-1 py-3 text-center border-b-2 border-primary text-primary font-medium">
            Catégories
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Toutes catégories</h2>
        <div className="grid grid-cols-2 gap-4">
          {categories.map((category) => (
            <Card
              key={category.slug}
              className="relative overflow-hidden cursor-pointer group hover:scale-105 transition-transform duration-200"
              onClick={() => navigate(`/search?category=${category.slug}`)}
            >
              <div className={`h-32 bg-gradient-to-br ${category.gradient} flex items-center justify-center relative`}>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                <category.icon className="h-12 w-12 text-white drop-shadow-lg relative z-10" />
              </div>
              <div className="p-3 bg-background">
                <p className="text-sm font-medium text-center line-clamp-2">
                  {category.name}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Categories;
