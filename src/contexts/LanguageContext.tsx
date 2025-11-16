import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type Language = "fr" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>("fr");

  useEffect(() => {
    // Load language from user profile
    const loadUserLanguage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("language")
          .eq("id", user.id)
          .single();
        
        if (profile?.language) {
          setLanguageState(profile.language as Language);
        }
      } else {
        // Load from localStorage for non-authenticated users
        const saved = localStorage.getItem("language");
        if (saved) {
          setLanguageState(saved as Language);
        }
      }
    };
    
    loadUserLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    
    // Update in database if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ language: lang })
        .eq("id", user.id);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Translations object
const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navigation
    "nav.home": "Accueil",
    "nav.categories": "Catégories",
    "nav.publish": "Publier",
    "nav.messages": "Messages",
    "nav.profile": "Profil",
    "nav.search": "Rechercher",
    "nav.favorites": "Favoris",
    "nav.settings": "Paramètres",
    
    // Hero section
    "hero.title": "Bienvenue sur ReVend",
    "hero.subtitle": "Donnez une seconde vie à vos articles",
    "hero.search_placeholder": "Rechercher un article de seconde vie...",
    "hero.search_button": "Rechercher",
    
    // Categories
    "categories.title": "Catégories populaires",
    "categories.all": "Toutes les catégories",
    
    // Listings
    "listings.recent": "Toutes les catégories",
    "listings.recommended": "Recommandé pour vous",
    "listings.recently_viewed": "Récemment vus",
    "listings.no_results": "Aucune annonce disponible pour le moment",
    "listings.be_first": "Soyez le premier à publier une annonce !",
    "listings.no_image": "Pas d'image",
    "listings.views": "vues",
    "listings.free": "Gratuit",
    "listings.no_local": "Aucune annonce autour de vous pour l'instant",
    "listings.nearby_countries": "Annonces des pays voisins",
    
    // Conditions
    "condition.new": "Neuf",
    "condition.like_new": "Comme neuf",
    "condition.good": "Bon état",
    "condition.fair": "État moyen",
    
    // Listing detail
    "listing.contact_seller": "Contacter le vendeur",
    "listing.share": "Partager",
    "listing.report": "Signaler",
    "listing.description": "Description",
    "listing.location": "Localisation",
    "listing.seller": "Vendeur",
    
    // Publish
    "publish.title": "Publier une annonce",
    "publish.form.title": "Titre",
    "publish.form.title_placeholder": "Ex: iPhone 12 Pro Max",
    "publish.form.description": "Description",
    "publish.form.description_placeholder": "Décrivez votre article en détail...",
    "publish.form.price": "Prix (FCFA)",
    "publish.form.price_placeholder": "0",
    "publish.form.free": "Article gratuit",
    "publish.form.category": "Catégorie",
    "publish.form.category_placeholder": "Sélectionner une catégorie",
    "publish.form.location": "Localisation",
    "publish.form.location_placeholder": "Ex: Dakar, Sénégal",
    "publish.form.condition": "État",
    "publish.form.images": "Photos",
    "publish.form.submit": "Publier l'annonce",
    "publish.form.submitting": "Publication...",
    "publish.success": "Annonce publiée !",
    "publish.success_message": "Votre annonce est maintenant en ligne",
    "publish.error": "Erreur",
    "publish.error_images": "Ajoutez au moins une photo de votre article",
    
    // Search & Filters
    "search.title": "Rechercher",
    "search.results": "résultat",
    "search.results_plural": "résultats",
    "search.no_results": "Aucun résultat trouvé",
    "search.modify_criteria": "Essayez de modifier vos critères de recherche",
    "search.filters": "Filtres",
    "search.category": "Catégorie",
    "search.min_price": "Prix minimum",
    "search.max_price": "Prix maximum",
    "search.location": "Localisation",
    "search.location_placeholder": "Ville ou pays",
    "search.condition": "État",
    "search.sort_by": "Trier par",
    "search.sort.recent": "Plus récents",
    "search.sort.price_asc": "Prix croissant",
    "search.sort.price_desc": "Prix décroissant",
    "search.sort.popular": "Populaires",
    "search.apply": "Appliquer",
    "search.reset": "Réinitialiser",
    "search.all": "Tous",
    
    // Messages
    "messages.title": "Messages",
    "messages.no_conversations": "Aucune conversation",
    "messages.type_message": "Tapez un message...",
    "messages.send": "Envoyer",
    
    // Profile
    "profile.edit": "Modifier le profil",
    "profile.listings": "Annonces",
    "profile.followers": "Abonnés",
    "profile.following": "Abonnements",
    "profile.reviews": "Avis",
    "profile.verified": "Vendeur vérifié",
    "profile.member_since": "Membre depuis",
    "profile.response_rate": "Taux de réponse",
    "profile.response_time": "Temps de réponse",
    "profile.sales": "ventes",
    
    // Settings
    "settings.title": "Paramètres",
    "settings.account": "Compte",
    "settings.edit_profile": "Modifier le profil",
    "settings.account_management": "Gestion du compte",
    "settings.language": "Langue",
    "settings.language_description": "Choisissez votre langue préférée",
    "settings.notifications": "Notifications",
    "settings.help": "Aide & Support",
    "settings.privacy": "Confidentialité",
    "settings.terms": "Conditions d'utilisation",
    "settings.logout": "Déconnexion",
    
    // Auth
    "auth.login": "Connexion",
    "auth.signup": "Inscription",
    "auth.email": "Email",
    "auth.password": "Mot de passe",
    "auth.full_name": "Nom complet",
    "auth.forgot_password": "Mot de passe oublié ?",
    "auth.no_account": "Pas de compte ?",
    "auth.have_account": "Déjà un compte ?",
    
    // Common
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.delete": "Supprimer",
    "common.edit": "Modifier",
    "common.back": "Retour",
    "common.loading": "Chargement...",
    "common.sold": "Vendu",
    "common.active": "Actif",
    "common.inactive": "Inactif",
    "common.minutes": "minutes",
    "common.hours": "heures",
    "common.days": "jours",
    "common.mode": "Mode",
    "common.dark": "sombre",
    "common.light": "clair",
    "common.activated": "activé",
  },
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.categories": "Categories",
    "nav.publish": "Publish",
    "nav.messages": "Messages",
    "nav.profile": "Profile",
    "nav.search": "Search",
    "nav.favorites": "Favorites",
    "nav.settings": "Settings",
    
    // Hero section
    "hero.title": "Welcome to ReVend",
    "hero.subtitle": "Give your items a second life",
    "hero.search_placeholder": "Search for second-hand items...",
    "hero.search_button": "Search",
    
    // Categories
    "categories.title": "Popular Categories",
    "categories.all": "All Categories",
    
    // Listings
    "listings.recent": "All Categories",
    "listings.recommended": "Recommended for You",
    "listings.recently_viewed": "Recently Viewed",
    "listings.no_results": "No listings available at the moment",
    "listings.be_first": "Be the first to post a listing!",
    "listings.no_image": "No image",
    "listings.views": "views",
    "listings.free": "Free",
    "listings.no_local": "No listings around you at the moment",
    "listings.nearby_countries": "Listings from nearby countries",
    
    // Conditions
    "condition.new": "New",
    "condition.like_new": "Like New",
    "condition.good": "Good",
    "condition.fair": "Fair",
    
    // Listing detail
    "listing.contact_seller": "Contact Seller",
    "listing.share": "Share",
    "listing.report": "Report",
    "listing.description": "Description",
    "listing.location": "Location",
    "listing.seller": "Seller",
    
    // Publish
    "publish.title": "Post a Listing",
    "publish.form.title": "Title",
    "publish.form.title_placeholder": "Ex: iPhone 12 Pro Max",
    "publish.form.description": "Description",
    "publish.form.description_placeholder": "Describe your item in detail...",
    "publish.form.price": "Price (FCFA)",
    "publish.form.price_placeholder": "0",
    "publish.form.free": "Free item",
    "publish.form.category": "Category",
    "publish.form.category_placeholder": "Select a category",
    "publish.form.location": "Location",
    "publish.form.location_placeholder": "Ex: Dakar, Senegal",
    "publish.form.condition": "Condition",
    "publish.form.images": "Photos",
    "publish.form.submit": "Publish Listing",
    "publish.form.submitting": "Publishing...",
    "publish.success": "Listing Published!",
    "publish.success_message": "Your listing is now live",
    "publish.error": "Error",
    "publish.error_images": "Add at least one photo of your item",
    
    // Search & Filters
    "search.title": "Search",
    "search.results": "result",
    "search.results_plural": "results",
    "search.no_results": "No results found",
    "search.modify_criteria": "Try modifying your search criteria",
    "search.filters": "Filters",
    "search.category": "Category",
    "search.min_price": "Minimum Price",
    "search.max_price": "Maximum Price",
    "search.location": "Location",
    "search.location_placeholder": "City or country",
    "search.condition": "Condition",
    "search.sort_by": "Sort by",
    "search.sort.recent": "Most Recent",
    "search.sort.price_asc": "Price: Low to High",
    "search.sort.price_desc": "Price: High to Low",
    "search.sort.popular": "Popular",
    "search.apply": "Apply",
    "search.reset": "Reset",
    "search.all": "All",
    
    // Messages
    "messages.title": "Messages",
    "messages.no_conversations": "No conversations",
    "messages.type_message": "Type a message...",
    "messages.send": "Send",
    
    // Profile
    "profile.edit": "Edit Profile",
    "profile.listings": "Listings",
    "profile.followers": "Followers",
    "profile.following": "Following",
    "profile.reviews": "Reviews",
    "profile.verified": "Verified Seller",
    "profile.member_since": "Member Since",
    "profile.response_rate": "Response Rate",
    "profile.response_time": "Response Time",
    "profile.sales": "sales",
    
    // Settings
    "settings.title": "Settings",
    "settings.account": "Account",
    "settings.edit_profile": "Edit Profile",
    "settings.account_management": "Account Management",
    "settings.language": "Language",
    "settings.language_description": "Choose your preferred language",
    "settings.notifications": "Notifications",
    "settings.help": "Help & Support",
    "settings.privacy": "Privacy Policy",
    "settings.terms": "Terms of Service",
    "settings.logout": "Logout",
    
    // Auth
    "auth.login": "Login",
    "auth.signup": "Sign Up",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.full_name": "Full Name",
    "auth.forgot_password": "Forgot password?",
    "auth.no_account": "No account?",
    "auth.have_account": "Already have an account?",
    
    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.back": "Back",
    "common.loading": "Loading...",
    "common.sold": "Sold",
    "common.active": "Active",
    "common.inactive": "Inactive",
    "common.minutes": "minutes",
    "common.hours": "hours",
    "common.days": "days",
    "common.mode": "Mode",
    "common.dark": "dark",
    "common.light": "light",
    "common.activated": "activated",
  }
};
