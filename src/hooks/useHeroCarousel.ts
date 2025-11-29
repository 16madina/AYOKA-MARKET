import { useState, useEffect } from "react";
import heroImage1 from "@/assets/hero-marketplace-new.jpg";
import heroImage2 from "@/assets/hero-marketplace-1.jpg";
import heroImage3 from "@/assets/hero-marketplace-2.jpg";
import heroImage4 from "@/assets/hero-marketplace-3.jpg";

// Liste des images de hero disponibles
const HERO_IMAGES = [
  heroImage1, // Image originale
  heroImage2, // Marché africain traditionnel au coucher du soleil
  heroImage3, // E-commerce moderne africain
  heroImage4, // Artisanat et produits africains
];

/**
 * Hook pour gérer la rotation des images de fond du hero
 * Change l'image à chaque nouvelle visite de la page
 */
export const useHeroCarousel = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  useEffect(() => {
    // Récupérer l'index de la dernière image vue
    const lastImageIndex = parseInt(localStorage.getItem('hero_image_index') || '0', 10);
    
    // Calculer le prochain index (rotation circulaire)
    const nextIndex = (lastImageIndex + 1) % HERO_IMAGES.length;
    
    // Sauvegarder le nouvel index
    localStorage.setItem('hero_image_index', nextIndex.toString());
    
    // Mettre à jour l'état
    setCurrentImageIndex(nextIndex);
  }, []); // Exécuté une seule fois au montage
  
  return {
    currentImage: HERO_IMAGES[currentImageIndex],
    imageIndex: currentImageIndex,
  };
};
