import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, User, Moon, Sun } from "lucide-react";
import { useDarkMode } from "@/hooks/useDarkMode";

interface HeaderProps {
  isAuthenticated: boolean;
}

const Header = ({ isAuthenticated }: HeaderProps) => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-primary">Revivo</h1>
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
