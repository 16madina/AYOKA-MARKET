import { House, LayoutGrid, CirclePlus, MessagesSquare, CircleUserRound } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { Badge } from "@/components/ui/badge";

const BottomNav = () => {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { unreadCount } = useUnreadMessages(user?.id);

  const navItems = [
    { to: "/", icon: House, label: "Accueil" },
    { to: "/categories", icon: LayoutGrid, label: "Catégories" },
    { to: "/publish", icon: CirclePlus, label: "Publier" },
    { to: "/messages", icon: MessagesSquare, label: "Messages", badge: unreadCount },
    { to: "/profile", icon: CircleUserRound, label: "Profil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-background/98 border-t border-border backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <div className="relative max-w-screen-xl mx-auto px-2 py-2 pb-safe">
        <div className="flex items-center justify-around gap-0.5">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className="flex-1"
              activeClassName=""
            >
              {({ isActive }) => (
                <div
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 rounded-2xl transition-all duration-200",
                    "hover:scale-105 active:scale-90 active:bg-primary/20",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-warm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <div className="relative">
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-all duration-200",
                        isActive && "drop-shadow-sm animate-scale-in"
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {badge !== undefined && badge > 0 && (
                      <Badge 
                        className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-destructive text-destructive-foreground border-2 border-background animate-scale-in shadow-lg"
                      >
                        {badge > 9 ? '9+' : badge}
                      </Badge>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[9px] font-medium transition-all duration-200",
                      isActive ? "opacity-100" : "opacity-70"
                    )}
                  >
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
