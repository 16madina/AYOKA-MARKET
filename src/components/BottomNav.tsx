import { Home, Grid3x3, PlusCircle, MessageCircle, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

const BottomNav = () => {
  const navItems = [
    { to: "/", icon: Home, label: "Accueil" },
    { to: "/categories", icon: Grid3x3, label: "Catégories" },
    { to: "/publish", icon: PlusCircle, label: "Publier" },
    { to: "/messages", icon: MessageCircle, label: "Messages" },
    { to: "/profile", icon: User, label: "Profil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
              activeClassName="text-primary"
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn(
                    "h-6 w-6 transition-all",
                    isActive && "scale-110"
                  )} />
                  <span className="text-xs mt-1">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
