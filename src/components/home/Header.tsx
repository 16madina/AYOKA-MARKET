import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogIn, User, Moon, Sun, Bell } from "lucide-react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  isAuthenticated: boolean;
}

const Header = ({ isAuthenticated }: HeaderProps) => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [userId, setUserId] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    const getUser = async () => {
      if (!isAuthenticated) {
        setUserId(undefined);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id);
    };
    getUser();
  }, [isAuthenticated]);

  const { unreadCount } = useUnreadMessages(userId);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-primary flex items-baseline gap-1">
            DJASSA
            <span className="text-xl font-normal italic text-primary/80" style={{ fontFamily: 'cursive' }}>Market</span>
          </h1>
        </div>

        <nav className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            className="gap-2"
            aria-label="Changer de thème"
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/messages")}
              className="gap-2 relative"
              aria-label="Notifications"
            >
              <Bell className={`h-4 w-4 ${unreadCount > 0 ? 'animate-pulse text-primary' : ''}`} />
              <span className="hidden sm:inline">Notifications</span>
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-bounce"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          )}
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
