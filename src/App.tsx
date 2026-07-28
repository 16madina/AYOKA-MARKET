import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import SplashScreen from "./components/SplashScreen";
import { ScrollToTop } from "./components/ScrollToTop";
import { usePushNotifications, getPendingNotificationRoute } from "./hooks/usePushNotifications";
import { useSplashPreference } from "./hooks/useSplashPreference";
import { useAppRatingPrompt } from "./hooks/useAppRatingPrompt";
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
import ChildSafety from "./pages/settings/ChildSafety";
import Transactions from "./pages/Transactions";
import SellerBadgesInfo from "./pages/settings/SellerBadges";
import Referral from "./pages/Referral";
import OpenApp from "./pages/OpenApp";
import Download from "./pages/Download";

import TestCamera from "./pages/TestCamera";
import AdminPerformance from "./pages/AdminPerformance";
import EmailVerified from "./pages/EmailVerified";
import MapView from "./pages/MapView";
import AdminNotifications from "./pages/AdminNotifications";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { NotificationPermissionPrompt } from "./components/notifications/NotificationPermissionPrompt";
import { AppRatingPrompt } from "./components/AppRatingPrompt";
import { DeepLinkHandler } from "./components/DeepLinkHandler";

const queryClient = new QueryClient();

// Component to handle pending notification navigation
const NotificationNavigationHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for pending notification route
    const checkPendingRoute = () => {
      let pendingRoute: string | null = null;
      
      try {
        pendingRoute = sessionStorage.getItem("pendingNotificationRoute");
      } catch {
        pendingRoute = null;
      }

      // Also check the module-level variable
      pendingRoute = pendingRoute || getPendingNotificationRoute();

      if (pendingRoute && pendingRoute !== location.pathname) {
        console.log("📍 Navigating to pending notification route:", pendingRoute);
        try {
          sessionStorage.removeItem("pendingNotificationRoute");
        } catch {
          // ignore
        }
        navigate(pendingRoute, { replace: true });
      }
    };

    // Check immediately
    checkPendingRoute();

    // Also check after a delay for cold start scenarios
    const timer = setTimeout(checkPendingRoute, 500);
    
    // Set up an interval to keep checking for a short period (for slow cold starts)
    let checkCount = 0;
    const interval = setInterval(() => {
      checkCount++;
      if (checkCount >= 5) {
        clearInterval(interval);
        return;
      }
      checkPendingRoute();
    }, 300);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [navigate, location.pathname]);

  return null;
};

// Inner component that uses hooks requiring React context
const AppContent = () => {
  const location = useLocation();
  
  // Pages where we don't show global prompts (landing pages, etc.)
  const isLandingPage = location.pathname === '/download' || location.pathname === '/open-app' || location.pathname.startsWith('/open-app/');
  
  // Initialize push notifications inside BrowserRouter (skip for landing pages)
  usePushNotifications();
  
  // App rating system
  const { showPrompt, setShowPrompt, markAsRated, dismissPrompt, dismissPermanently } = useAppRatingPrompt();

  return (
    <>
      <ScrollToTop />
      <NotificationNavigationHandler />
      <DeepLinkHandler />
      <div>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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
          <Route path="/settings/child-safety" element={<ChildSafety />} />
          <Route path="/child-safety" element={<ChildSafety />} />
          <Route path="/child-safety-standards" element={<ChildSafety />} />
          <Route path="/settings/seller-badges" element={<SellerBadgesInfo />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/test-camera" element={<TestCamera />} />
          <Route path="/admin/performance" element={<AdminPerformance />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/open-app" element={<OpenApp />} />
          <Route path="/open-app/*" element={<OpenApp />} />
          <Route path="/download" element={<Download />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        {!isLandingPage && <NotificationPermissionPrompt />}
        {!isLandingPage && (
          <AppRatingPrompt
            open={showPrompt}
            onOpenChange={setShowPrompt}
            onRated={markAsRated}
            onDismiss={dismissPrompt}
            onDismissPermanently={dismissPermanently}
          />
        )}
      </div>
    </>
  );
};

const App = () => {
  const { isReturningUser, markFullSplashSeen } = useSplashPreference();

  const safeSessionSet = (key: string, value: string) => {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // ignore
    }
  };

  const safeSessionGet = (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  };

  // Only show splash on initial app load, not on internal navigation
  // Check if splash was already shown in this session
  const [showSplash, setShowSplash] = useState(() => {
    const alreadyShown = safeSessionGet("splashShownThisSession");
    return !alreadyShown;
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showContent, setShowContent] = useState(() => {
    // If splash already shown, show content immediately
    const alreadyShown = safeSessionGet("splashShownThisSession");
    return !!alreadyShown;
  });

  const handleSplashFinish = () => {
    setIsTransitioning(true);

    setTimeout(() => {
      setShowContent(true);
    }, 100);

    try {
      if (!isReturningUser) {
        markFullSplashSeen();
      }
      safeSessionSet("hasSeenSplash", "true");
      safeSessionSet("splashShownThisSession", "true");
    } catch {
      // ignore
    }

    setTimeout(() => {
      setShowSplash(false);
      setIsTransitioning(false);
    }, 600);
  };

  useEffect(() => {
    if (!showSplash && !isTransitioning) {
      setShowContent(true);
    }
  }, [showSplash, isTransitioning]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        
        {/* Splash Screen Layer */}
        {showSplash && (
          <div 
            className={`fixed inset-0 z-50 transition-all duration-700 ${
              isTransitioning ? "opacity-0 scale-110" : "opacity-100 scale-100"
            }`}
          >
             <SplashScreen 
               onFinish={handleSplashFinish} 
               isShortVersion={false}
             />
          </div>
        )}
        
        {/* Main Content Layer */}
        <div
          className={`transition-opacity duration-700 ease-out ${
            showContent ? "opacity-100" : "opacity-0"
          }`}
          style={{
            visibility: showContent ? "visible" : "hidden",
          }}
        >
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
