import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  UserPlus, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin,
  Eye,
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NewUser {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
  email_verified: boolean | null;
  email?: string;
}

export function NewUsersTab() {
  const navigate = useNavigate();
  const [periodFilter, setPeriodFilter] = useState<string>("24h");

  // Fetch new users with emails
  const { data: newUsers, isLoading } = useQuery({
    queryKey: ["admin-new-users", periodFilter],
    queryFn: async () => {
      // Calculate the date filter
      const now = new Date();
      let fromDate: Date;
      
      switch (periodFilter) {
        case "24h":
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .gte("created_at", fromDate.toISOString())
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch emails via edge function
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        return profilesData as NewUser[];
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-emails`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          return profilesData as NewUser[];
        }

        const { emails } = await response.json();
        const emailMap = new Map<string, string>();
        emails?.forEach((item: { id: string; email: string }) => {
          if (item.email) {
            emailMap.set(item.id, item.email);
          }
        });

        return profilesData?.map(profile => ({
          ...profile,
          email: emailMap.get(profile.id) || undefined
        })) as NewUser[] || [];
      } catch (error) {
        console.error('Error fetching emails:', error);
        return profilesData as NewUser[];
      }
    },
  });

  // Statistics
  const stats = useMemo(() => {
    if (!newUsers) return { total: 0, verified: 0, withPhone: 0 };
    
    return {
      total: newUsers.length,
      verified: newUsers.filter(u => u.email_verified).length,
      withPhone: newUsers.filter(u => u.phone).length,
    };
  }, [newUsers]);

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case "24h": return "dernières 24 heures";
      case "7d": return "7 derniers jours";
      case "30d": return "30 derniers jours";
      default: return "dernières 24 heures";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }
  };

  const getInitials = (user: NewUser) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.full_name) {
      const parts = user.full_name.split(' ');
      return parts.length > 1 
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : user.full_name.substring(0, 2).toUpperCase();
    }
    return "??";
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Nouveaux</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-green-500/10 rounded-full">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold">{stats.verified}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Vérifiés</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-blue-500/10 rounded-full">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold">{stats.withPhone}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Avec tél.</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Nouveaux utilisateurs - {getPeriodLabel()}
            </CardTitle>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-9">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Dernières 24h</SelectItem>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : newUsers && newUsers.length > 0 ? (
            <div className="space-y-2">
              {newUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs sm:text-sm bg-primary/10 text-primary">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {user.full_name || user.first_name || "Utilisateur"}
                      </p>
                      {user.email_verified && (
                        <Badge variant="outline" className="text-[10px] h-5 bg-green-500/10 text-green-600 border-green-200">
                          Vérifié
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-xs sm:text-sm text-muted-foreground">
                      {user.email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </span>
                      )}
                      {user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {user.phone}
                        </span>
                      )}
                      {(user.city || user.country) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {[user.city, user.country].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(user.created_at)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/seller/${user.id}`)}
                      className="h-7 text-xs px-2"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Voir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">Aucun nouvel utilisateur</p>
              <p className="text-xs">sur cette période</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
