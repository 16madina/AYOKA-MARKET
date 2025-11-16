import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashScreen from "./components/SplashScreen";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Categories from "./pages/Categories";
import CategoryDetail from "./pages/CategoryDetail";
import Publish from "./pages/Publish";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import EditProfile from "./pages/EditProfile";
import Favorites from "./pages/Favorites";
import Help from "./pages/Help";
import AccountManagement from "./pages/AccountManagement";
import ListingDetail from "./pages/ListingDetail";
import SellerPublicProfile from "./pages/SellerPublicProfile";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import FAQ from "./pages/settings/FAQ";
import Support from "./pages/settings/Support";
import Report from "./pages/settings/Report";
import Terms from "./pages/settings/Terms";
import Privacy from "./pages/settings/Privacy";
import ChangePassword from "./pages/settings/ChangePassword";
import TwoFactor from "./pages/settings/TwoFactor";
import ProfileVisibility from "./pages/settings/ProfileVisibility";
import BlockedUsers from "./pages/settings/BlockedUsers";
import SalesHistory from "./pages/settings/SalesHistory";
import CommunityGuidelines from "./pages/settings/CommunityGuidelines";

import TestCamera from "./pages/TestCamera";
import AdminPerformance from "./pages/AdminPerformance";
import EmailVerified from "./pages/EmailVerified";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/email-verified" element={<EmailVerified />} />
          <Route path="/search" element={<Search />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/:slug" element={<CategoryDetail />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/seller/:id" element={<SellerPublicProfile />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/help" element={<Help />} />
          <Route path="/account-management" element={<AccountManagement />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/settings/faq" element={<FAQ />} />
          <Route path="/settings/support" element={<Support />} />
          <Route path="/settings/report" element={<Report />} />
          <Route path="/settings/terms" element={<Terms />} />
          <Route path="/settings/privacy" element={<Privacy />} />
          <Route path="/settings/change-password" element={<ChangePassword />} />
          <Route path="/settings/two-factor" element={<TwoFactor />} />
          <Route path="/settings/profile-visibility" element={<ProfileVisibility />} />
          <Route path="/settings/blocked-users" element={<BlockedUsers />} />
          <Route path="/settings/sales-history" element={<SalesHistory />} />
          <Route path="/settings/community-guidelines" element={<CommunityGuidelines />} />
          <Route path="/test-camera" element={<TestCamera />} />
          <Route path="/admin/performance" element={<AdminPerformance />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
