import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import RecentListings from "@/components/home/RecentListings";
import RecentlyViewed from "@/components/home/RecentlyViewed";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen pb-20">
      {!isAuthenticated && (
        <div className="bg-primary text-primary-foreground p-4 text-center">
          <p className="mb-2">Connectez-vous pour profiter de toutes les fonctionnalités</p>
          <Button
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="bg-white text-primary hover:bg-white/90"
          >
            Se connecter
          </Button>
        </div>
      )}
      
      <HeroSection />
      <RecentlyViewed />
      <CategoryGrid />
      <RecentListings />
      <BottomNav />
    </div>
  );
};

export default Index;
