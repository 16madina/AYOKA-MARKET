import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, User, Moon, Sun, MapPin, Loader2 } from "lucide-react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { SystemNotifications } from "@/components/notifications/SystemNotifications";
import ayokaLogo from "@/assets/ayoka-logo.png";

interface HeaderProps {
  isAuthenticated: boolean;
}

const Header = ({ isAuthenticated }: HeaderProps) => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
    const fetchUserLocation = async () => {
      // Check cache first
      const cached = sessionStorage.getItem('user_neighborhood');
      if (cached) {
        setUserLocation(cached);
        setIsLoadingLocation(false);
        return;
      }

      try {
        // Get user's GPS position
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes cache
          });
        });

        const { latitude, longitude } = position.coords;

        // Reverse geocode to get neighborhood/commune
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=16`
        );
        const data = await response.json();

        // Extract neighborhood or suburb or city
        const neighborhood = 
          data.address?.neighbourhood ||
          data.address?.suburb ||
          data.address?.quarter ||
          data.address?.hamlet ||
          data.address?.village ||
          data.address?.town ||
          data.address?.city_district ||
          data.address?.city ||
          null;

        if (neighborhood) {
          setUserLocation(neighborhood);
          sessionStorage.setItem('user_neighborhood', neighborhood);
        }
      } catch (error) {
        console.log('Could not get user location:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    fetchUserLocation();
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-safe">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img 
            src={ayokaLogo} 
            alt="AYOKA MARKET" 
            className="h-16 w-auto cursor-pointer transition-all duration-300 hover:scale-105 object-contain dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            onClick={() => navigate("/")}
          />
        </div>

        {/* User location display */}
        {(userLocation || isLoadingLocation) && (
          <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {isLoadingLocation ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span className="truncate max-w-[150px]">{userLocation}</span>
            )}
          </div>
        )}

        <nav className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            className="gap-2 min-h-[44px] min-w-[44px]"
            aria-label="Changer de thème"
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          {isAuthenticated && <SystemNotifications />}
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/profile")}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Mon profil</span>
            </Button>
          ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate("/auth", { state: { mode: 'login' } })}
            className="gap-2"
          >
            <LogIn className="h-4 w-4" />
            Se connecter
          </Button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
