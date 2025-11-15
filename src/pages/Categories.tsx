import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Search } from "lucide-react";

// Import des images
import gratuitImg from "@/assets/categories/gratuit.jpg";
import antiquitesImg from "@/assets/categories/antiquites.jpg";
import artImg from "@/assets/categories/art.jpg";
import piecesAutoImg from "@/assets/categories/pieces-auto.jpg";
import bebesImg from "@/assets/categories/bebes.jpg";
import livresFilmsImg from "@/assets/categories/livres-films-musique.jpg";
import electroniqueImg from "@/assets/categories/electronique.jpg";
import meublesImg from "@/assets/categories/meubles.jpg";
import videGrenierImg from "@/assets/categories/vide-grenier.jpg";
import santeBeauteImg from "@/assets/categories/sante-beaute.jpg";
import maisonCuisineImg from "@/assets/categories/maison-cuisine.jpg";
import bricolageImg from "@/assets/categories/bricolage.jpg";
import bijouxMontresImg from "@/assets/categories/bijoux-montres.jpg";
import vetementsEnfantsImg from "@/assets/categories/vetements-enfants.jpg";
import bagagesSacsImg from "@/assets/categories/bagages-sacs.jpg";
import pretPorterHommeImg from "@/assets/categories/pret-porter-homme.jpg";
import instrumentsMusiqueImg from "@/assets/categories/instruments-musique.jpg";
import patioJardinImg from "@/assets/categories/patio-jardin.jpg";
import produitsAnimauxImg from "@/assets/categories/produits-animaux.jpg";
import articlesSportImg from "@/assets/categories/articles-sport.jpg";
import jeuxJouetsImg from "@/assets/categories/jeux-jouets.jpg";
import autresImg from "@/assets/categories/autres.jpg";

const categories = [
  { 
    name: "Gratuit", 
    image: gratuitImg,
    slug: "gratuit"
  },
  { 
    name: "Antiquités et objets de collection", 
    image: antiquitesImg,
    slug: "antiquites"
  },
  { 
    name: "Art et artisanat", 
    image: artImg,
    slug: "art"
  },
  { 
    name: "Pièces automobiles", 
    image: piecesAutoImg,
    slug: "pieces-auto"
  },
  { 
    name: "Bébés", 
    image: bebesImg,
    slug: "bebes"
  },
  { 
    name: "Livres, films et musique", 
    image: livresFilmsImg,
    slug: "livres-films-musique"
  },
  { 
    name: "Appareils électroniques", 
    image: electroniqueImg,
    slug: "electronique"
  },
  { 
    name: "Meubles", 
    image: meublesImg,
    slug: "meubles"
  },
  { 
    name: "Vide-grenier", 
    image: videGrenierImg,
    slug: "vide-grenier"
  },
  { 
    name: "Santé et beauté", 
    image: santeBeauteImg,
    slug: "sante-beaute"
  },
  { 
    name: "Maison et cuisine", 
    image: maisonCuisineImg,
    slug: "maison-cuisine"
  },
  { 
    name: "Bricolage", 
    image: bricolageImg,
    slug: "bricolage"
  },
  { 
    name: "Bijoux et montres", 
    image: bijouxMontresImg,
    slug: "bijoux-montres"
  },
  { 
    name: "Vêtements pour enfants et bébés", 
    image: vetementsEnfantsImg,
    slug: "vetements-enfants"
  },
  { 
    name: "Bagages et sacs", 
    image: bagagesSacsImg,
    slug: "bagages-sacs"
  },
  { 
    name: "Prêt à porter homme", 
    image: pretPorterHommeImg,
    slug: "pret-porter-homme"
  },
  { 
    name: "Instruments de musique", 
    image: instrumentsMusiqueImg,
    slug: "instruments-musique"
  },
  { 
    name: "Patio et jardin", 
    image: patioJardinImg,
    slug: "patio-jardin"
  },
  { 
    name: "Produits pour animaux", 
    image: produitsAnimauxImg,
    slug: "produits-animaux"
  },
  { 
    name: "Articles de sport", 
    image: articlesSportImg,
    slug: "articles-sport"
  },
  { 
    name: "Jeux et jouets", 
    image: jeuxJouetsImg,
    slug: "jeux-jouets"
  },
  { 
    name: "Autres", 
    image: autresImg,
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
              className="relative overflow-hidden cursor-pointer group hover:scale-105 transition-transform duration-200 shadow-md"
              onClick={() => navigate(`/search?category=${category.slug}`)}
            >
              <div className="h-32 relative overflow-hidden">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
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
