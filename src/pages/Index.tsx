import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/home/Header";
import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import RecentListings from "@/components/home/RecentListings";
import RecentlyViewed from "@/components/home/RecentlyViewed";
import RecommendedListings from "@/components/home/RecommendedListings";
import FilterSheet from "@/components/home/FilterSheet";
import BottomNav from "@/components/BottomNav";

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
      <Header isAuthenticated={isAuthenticated} />
      <HeroSection />
      <CategoryGrid />
      <RecentlyViewed />
      <div className="px-4 py-4 flex justify-start">
        <FilterSheet />
      </div>
      <div className="container mx-auto px-4">
        <RecommendedListings />
      </div>
      <RecentListings />
      <BottomNav />
    </div>
  );
};

export default Index;
