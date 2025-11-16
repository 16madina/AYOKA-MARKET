import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TrendingUp, AlertCircle, Users } from "lucide-react";
import { errorTracker } from "@/utils/errorTracking";
import { performanceMonitor } from "@/utils/performanceMetrics";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function AdminPerformance() {
  const [errorStats, setErrorStats] = useState<Record<string, number>>({});
  const [perfStats, setPerfStats] = useState<any>({});

  useEffect(() => {
    setErrorStats(errorTracker.getErrorStats());
    setPerfStats(performanceMonitor.getStats());
  }, []);

  const { data: activeUsers } = useQuery({
    queryKey: ["active-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, is_online, last_seen")
        .eq("is_online", true);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000,
  });

  const { data: storageStats } = useQuery({
    queryKey: ["storage-stats"],
    queryFn: async () => {
      const { data: listingsData } = await supabase
        .from("listings")
        .select("images");

      const totalImages = (listingsData || []).reduce(
        (acc, listing) => acc + (listing.images?.length || 0),
        0
      );

      return { totalImages };
    },
  });

  const { data: dbStats } = useQuery({
    queryKey: ["db-stats"],
    queryFn: async () => {
      const [listingsCount, usersCount, messagesCount] = await Promise.all([
        supabase.from("listings").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
      ]);

      return {
        listings: listingsCount.count || 0,
        users: usersCount.count || 0,
        messages: messagesCount.count || 0,
      };
    },
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard Performance</h1>
          <Badge variant="default" className="text-base">
            <Activity className="h-4 w-4 mr-2" />
            Admin
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilisateurs Actifs</p>
                <p className="text-2xl font-bold">{activeUsers?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Annonces</p>
                <p className="text-2xl font-bold">{dbStats?.listings || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Images Stockées</p>
                <p className="text-2xl font-bold">{storageStats?.totalImages || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Erreurs (24h)</p>
                <p className="text-2xl font-bold">
                  {Object.values(errorStats).reduce((a, b) => a + b, 0)}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="errors">Erreurs</TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Métriques de Performance</h2>
              <div className="space-y-4">
                {Object.entries(perfStats).map(([name, stats]: [string, any]) => (
                  <div key={name} className="border-b pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{name}</span>
                      <Badge variant="secondary">{stats.count} fois</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Moyenne:</span>
                        <span className="ml-2 font-semibold">
                          {stats.avg.toFixed(2)}ms
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Min:</span>
                        <span className="ml-2 font-semibold">
                          {stats.min.toFixed(2)}ms
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max:</span>
                        <span className="ml-2 font-semibold">
                          {stats.max.toFixed(2)}ms
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {Object.keys(perfStats).length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune métrique disponible
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="errors">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Journal des Erreurs</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    errorTracker.clearErrors();
                    setErrorStats({});
                  }}
                >
                  Effacer
                </Button>
              </div>
              <div className="space-y-4">
                {Object.entries(errorStats).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <span className="font-medium capitalize">{type}</span>
                    </div>
                    <Badge variant="destructive">{count} erreurs</Badge>
                  </div>
                ))}
                {Object.keys(errorStats).length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune erreur enregistrée
                  </p>
                )}
              </div>
              
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Dernières Erreurs</h3>
                <div className="space-y-2">
                  {errorTracker.getErrors().slice(-5).reverse().map((error, idx) => (
                    <div key={idx} className="bg-destructive/10 p-3 rounded-lg text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="destructive" className="text-xs">
                          {error.type}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {new Date(error.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-destructive">{error.message}</p>
                      {error.device && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {error.device.platform} - {error.device.screenSize}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
