import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import Header from "@/components/home/Header";
import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import RecentListings from "@/components/home/RecentListings";
import RecentlyViewed from "@/components/home/RecentlyViewed";
import FilterSheet from "@/components/home/FilterSheet";
import RecommendedSheet from "@/components/home/RecommendedSheet";
import BottomNav from "@/components/BottomNav";
import { PullToRefresh } from "@/components/PullToRefresh";

const Index = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
    await queryClient.invalidateQueries({ queryKey: ["recentListings"] });
    await queryClient.invalidateQueries({ queryKey: ["recommendations"] });
  };

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
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen pb-20">
        <Header isAuthenticated={isAuthenticated} />
        <HeroSection />
        <CategoryGrid />
        <RecentlyViewed />
        <div className="px-4 py-4 flex justify-start gap-2">
          <FilterSheet />
          <RecommendedSheet />
        </div>
        <RecentListings />
        <BottomNav />
      </div>
    </PullToRefresh>
  );
};

export default Index;
