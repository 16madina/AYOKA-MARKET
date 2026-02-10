import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ShieldX, ShieldCheck, Eye, ExternalLink, RefreshCw, ImageOff, MessageSquareOff, Settings, ImageIcon } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BannedWordsManagement } from "./BannedWordsManagement";
import { BannedImageCategoriesManagement } from "./BannedImageCategoriesManagement";

export const ImageModerationDashboard = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filterSafe, setFilterSafe] = useState<boolean | null>(false);

  const { data: moderationLogs, isLoading, refetch } = useQuery({
    queryKey: ["moderation-logs", filterSafe],
    queryFn: async () => {
      let query = supabase
        .from("image_moderation_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filterSafe !== null) {
        query = query.eq("is_safe", filterSafe);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = [...new Set(data.filter(log => log.user_id).map(log => log.user_id))];
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", userIds);

          const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

          return data.map(log => ({
            ...log,
            profile: log.user_id ? profileMap.get(log.user_id) : null
          }));
        }
      }

      return data || [];
    },
  });

  const stats = {
    total: moderationLogs?.length || 0,
    rejected: moderationLogs?.filter(log => !log.is_safe).length || 0,
    approved: moderationLogs?.filter(log => log.is_safe).length || 0,
  };

  return (
    <Tabs defaultValue="images" className="space-y-3 sm:space-y-4">
      <div className="overflow-x-auto -mx-2 px-2 scrollbar-hide">
        <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-3 gap-0.5 sm:gap-1">
          <TabsTrigger value="images" className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
            <ImageOff className="h-4 w-4" />
            <span>Images</span>
          </TabsTrigger>
          <TabsTrigger value="image-rules" className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
            <Settings className="h-4 w-4" />
            <span>Règles</span>
          </TabsTrigger>
          <TabsTrigger value="words" className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
            <MessageSquareOff className="h-4 w-4" />
            <span>Mots</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="images" className="space-y-3 sm:space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card>
            <CardContent className="pt-3 sm:pt-6 px-2 sm:px-6">
              <div className="text-center">
                <p className="text-xl sm:text-3xl font-bold">{stats.total}</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/50">
            <CardContent className="pt-3 sm:pt-6 px-2 sm:px-6">
              <div className="text-center">
                <p className="text-xl sm:text-3xl font-bold text-destructive">{stats.rejected}</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Rejetées</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/50">
            <CardContent className="pt-3 sm:pt-6 px-2 sm:px-6">
              <div className="text-center">
                <p className="text-xl sm:text-3xl font-bold text-emerald-600">{stats.approved}</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">OK</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
              <div className="flex gap-1.5 sm:gap-2">
                <Button
                  variant={filterSafe === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterSafe(null)}
                  className="flex-1 sm:flex-none h-8 text-xs sm:text-sm"
                >
                  Toutes
                </Button>
                <Button
                  variant={filterSafe === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterSafe(false)}
                  className="flex-1 sm:flex-none h-8 text-xs sm:text-sm"
                >
                  <ShieldX className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Rejetées</span>
                </Button>
                <Button
                  variant={filterSafe === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterSafe(true)}
                  className="flex-1 sm:flex-none h-8 text-xs sm:text-sm"
                >
                  <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">OK</span>
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 text-xs sm:text-sm">
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card>
          <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ShieldX className="h-4 w-4 sm:h-5 sm:w-5" />
              Historique ({moderationLogs?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {isLoading ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                Chargement...
              </div>
            ) : moderationLogs?.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                Aucun log de modération
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {moderationLogs?.map((log: any) => (
                  <Card key={log.id} className={`p-2 sm:p-4 ${!log.is_safe ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                    <div className="flex items-start gap-2 sm:gap-4">
                      {/* Thumbnail */}
                      <div 
                        className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted cursor-pointer shrink-0"
                        onClick={() => setSelectedImage(log.moderation_image_url || log.image_url)}
                      >
                        {(log.moderation_image_url || log.image_url) ? (
                          <img
                            src={log.moderation_image_url || log.image_url}
                            alt="Moderated image"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              // If moderation_image_url failed, try original
                              if (log.moderation_image_url && target.src === log.moderation_image_url) {
                                target.src = log.image_url;
                              } else {
                                // Show placeholder icon instead
                                target.style.display = 'none';
                                target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                              }
                            }}
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        {!log.moderation_image_url && !log.is_safe && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ImageOff className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                          <Badge variant={log.is_safe ? "default" : "destructive"} className="text-[10px] sm:text-xs">
                            {log.is_safe ? (
                              <>
                                <ShieldCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                OK
                              </>
                            ) : (
                              <>
                                <ShieldX className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                Non
                              </>
                            )}
                          </Badge>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        </div>

                        {log.reason && (
                          <p className="text-[10px] sm:text-sm text-muted-foreground mb-1 sm:mb-2 line-clamp-2">
                            {log.reason}
                          </p>
                        )}

                        {log.profile && (
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                            <Avatar className="h-4 w-4 sm:h-5 sm:w-5">
                              <AvatarImage src={log.profile.avatar_url || ""} />
                              <AvatarFallback className="text-[8px] sm:text-xs">
                                {log.profile.full_name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground truncate">
                              {log.profile.full_name || "Inconnu"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(log.image_url, '_blank')}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Preview Dialog */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="mx-4 max-w-[calc(100%-2rem)] sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Aperçu</DialogTitle>
            </DialogHeader>
            {selectedImage && (
              <div className="flex justify-center">
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="max-h-[50vh] sm:max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </TabsContent>

      <TabsContent value="image-rules">
        <BannedImageCategoriesManagement />
      </TabsContent>

      <TabsContent value="words">
        <BannedWordsManagement />
      </TabsContent>
    </Tabs>
  );
};
