import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Bell, 
  BellRing, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Moon, 
  Clock,
  MessageCircle,
  DollarSign,
  Heart,
  Tag,
  TrendingDown,
  Megaphone,
  Mail,
  Smartphone,
  Eye,
  Users,
  Cloud,
  CloudOff,
  RefreshCw
} from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";

interface NotificationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface NotificationPreferences {
  // Types de notifications
  messages: boolean;
  offers: boolean;
  favorites: boolean;
  newListings: boolean;
  priceDrops: boolean;
  followers: boolean;
  reviews: boolean;
  marketing: boolean;
  
  // Canaux
  push: boolean;
  email: boolean;
  
  // Son et vibration
  soundEnabled: boolean;
  soundVolume: number;
  vibrationEnabled: boolean;
  vibrationIntensity: 'light' | 'medium' | 'strong';
  
  // Mode silencieux
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  
  // Aperçu
  showPreview: boolean;
  showSenderName: boolean;
  
  // Groupage
  groupNotifications: boolean;
}

const defaultPreferences: NotificationPreferences = {
  messages: true,
  offers: true,
  favorites: true,
  newListings: false,
  priceDrops: true,
  followers: true,
  reviews: true,
  marketing: false,
  push: true,
  email: true,
  soundEnabled: true,
  soundVolume: 70,
  vibrationEnabled: true,
  vibrationIntensity: 'medium',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  showPreview: true,
  showSenderName: true,
  groupNotifications: true
};

const STORAGE_KEY = 'notification_preferences';

export const NotificationSettings = ({ open, onOpenChange }: NotificationSettingsProps) => {
  const [settings, setSettings] = useState<NotificationPreferences>(defaultPreferences);
  const [activeTab, setActiveTab] = useState<'types' | 'sound' | 'schedule' | 'display'>('types');
  const [userId, setUserId] = useState<string | null>(null);
  const haptics = useHaptics();
  const queryClient = useQueryClient();

  // Récupérer l'utilisateur connecté
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    if (open) {
      getUser();
    }
  }, [open]);

  // Charger les préférences depuis la base de données
  const { data: cloudPreferences, isLoading, refetch } = useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Erreur chargement préférences:', error);
        return null;
      }
      
      // Cast via unknown pour satisfaire TypeScript avec JSONB
      const prefs = data?.notification_preferences;
      if (prefs && typeof prefs === 'object' && !Array.isArray(prefs)) {
        return prefs as unknown as NotificationPreferences;
      }
      return null;
    },
    enabled: !!userId && open,
  });

  // Mettre à jour les settings locaux quand les données cloud arrivent
  useEffect(() => {
    if (cloudPreferences) {
      setSettings({ ...defaultPreferences, ...cloudPreferences });
      // Aussi sauvegarder en local pour accès hors ligne
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudPreferences));
    } else if (open && !isLoading) {
      // Fallback sur localStorage si pas de données cloud
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setSettings({ ...defaultPreferences, ...JSON.parse(saved) });
        }
      } catch (e) {
        console.error('Erreur chargement préférences locales:', e);
      }
    }
  }, [cloudPreferences, open, isLoading]);

  // Mutation pour sauvegarder en base
  const saveMutation = useMutation({
    mutationFn: async (preferences: NotificationPreferences) => {
      if (!userId) {
        throw new Error('Utilisateur non connecté');
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: JSON.parse(JSON.stringify(preferences)) })
        .eq('id', userId);
      
      if (error) throw error;
      
      return preferences;
    },
    onSuccess: (preferences) => {
      // Sauvegarder aussi en local
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      // Invalider le cache
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', userId] });
      haptics.success();
      toast.success("Préférences synchronisées avec votre compte", {
        description: "Vos paramètres seront disponibles sur tous vos appareils"
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Erreur sauvegarde:', error);
      // Sauvegarder au moins en local
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      haptics.warning();
      toast.warning("Préférences enregistrées localement", {
        description: "La synchronisation cloud a échoué, les données sont sauvegardées sur cet appareil"
      });
      onOpenChange(false);
    }
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const updateSetting = <K extends keyof NotificationPreferences>(
    key: K, 
    value: NotificationPreferences[K]
  ) => {
    haptics.light();
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'types' as const, label: 'Types', icon: Bell },
    { id: 'sound' as const, label: 'Son', icon: Volume2 },
    { id: 'schedule' as const, label: 'Horaires', icon: Clock },
    { id: 'display' as const, label: 'Affichage', icon: Eye }
  ];

  const NotificationTypeItem = ({ 
    icon: Icon, 
    label, 
    description, 
    settingKey,
    iconColor 
  }: { 
    icon: any; 
    label: string; 
    description: string; 
    settingKey: keyof NotificationPreferences;
    iconColor: string;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className={`${iconColor} p-2 rounded-xl`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        checked={settings[settingKey] as boolean}
        onCheckedChange={(checked) => updateSetting(settingKey, checked)}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary" />
              Préférences de notifications
            </div>
            {/* Indicateur de synchronisation */}
            <div className="flex items-center gap-1.5">
              {isLoading ? (
                <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
              ) : cloudPreferences ? (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <Cloud className="h-3.5 w-3.5" />
                  <span>Sync</span>
                </div>
              ) : userId ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CloudOff className="h-3.5 w-3.5" />
                  <span>Local</span>
                </div>
              ) : null}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-2 overflow-x-auto">
          {tabs.map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                haptics.light();
                setActiveTab(tab.id);
              }}
              className="flex items-center gap-1.5 shrink-0"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Card className="p-4">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-10 rounded-full" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <>
              {/* Types de notifications */}
              {activeTab === 'types' && (
                <>
                  <Card className="p-4">
                    <h3 className="font-medium text-sm mb-4 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      Communications
                    </h3>
                    
                    <NotificationTypeItem
                      icon={MessageCircle}
                      label="Messages"
                      description="Nouveaux messages des acheteurs/vendeurs"
                      settingKey="messages"
                      iconColor="bg-green-500/10 text-green-600"
                    />
                    <Separator className="my-2" />
                    <NotificationTypeItem
                      icon={DollarSign}
                      label="Offres de prix"
                      description="Propositions de prix sur vos annonces"
                      settingKey="offers"
                      iconColor="bg-yellow-500/10 text-yellow-600"
                    />
                    <Separator className="my-2" />
                    <NotificationTypeItem
                      icon={Users}
                      label="Nouveaux abonnés"
                      description="Quand quelqu'un vous suit"
                      settingKey="followers"
                      iconColor="bg-blue-500/10 text-blue-600"
                    />
                    <Separator className="my-2" />
                    <NotificationTypeItem
                      icon={Heart}
                      label="Avis reçus"
                      description="Nouvelles évaluations de vos transactions"
                      settingKey="reviews"
                      iconColor="bg-pink-500/10 text-pink-600"
                    />
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-medium text-sm mb-4 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      Annonces et favoris
                    </h3>
                    
                    <NotificationTypeItem
                      icon={Heart}
                      label="Favoris"
                      description="Activité sur vos annonces favorites"
                      settingKey="favorites"
                      iconColor="bg-red-500/10 text-red-600"
                    />
                    <Separator className="my-2" />
                    <NotificationTypeItem
                      icon={Tag}
                      label="Nouvelles annonces"
                      description="Annonces correspondant à vos recherches"
                      settingKey="newListings"
                      iconColor="bg-purple-500/10 text-purple-600"
                    />
                    <Separator className="my-2" />
                    <NotificationTypeItem
                      icon={TrendingDown}
                      label="Baisse de prix"
                      description="Prix réduits sur vos favoris"
                      settingKey="priceDrops"
                      iconColor="bg-emerald-500/10 text-emerald-600"
                    />
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-medium text-sm mb-4 flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary" />
                      Canaux de réception
                    </h3>
                    
                    <NotificationTypeItem
                      icon={Smartphone}
                      label="Notifications push"
                      description="Recevoir des notifications sur l'appareil"
                      settingKey="push"
                      iconColor="bg-indigo-500/10 text-indigo-600"
                    />
                    <Separator className="my-2" />
                    <NotificationTypeItem
                      icon={Mail}
                      label="Email"
                      description="Recevoir des emails de notification"
                      settingKey="email"
                      iconColor="bg-cyan-500/10 text-cyan-600"
                    />
                    <Separator className="my-2" />
                    <NotificationTypeItem
                      icon={Megaphone}
                      label="Marketing"
                      description="Offres promotionnelles et conseils"
                      settingKey="marketing"
                      iconColor="bg-orange-500/10 text-orange-600"
                    />
                  </Card>
                </>
              )}

              {/* Son et vibration */}
              {activeTab === 'sound' && (
                <>
                  <Card className="p-4 space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-500/10 text-blue-600 p-2 rounded-xl">
                            {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Son des notifications</Label>
                            <p className="text-xs text-muted-foreground">Jouer un son à la réception</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.soundEnabled}
                          onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
                        />
                      </div>
                      
                      {settings.soundEnabled && (
                        <div className="ml-12 space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-2 block">
                              Volume: {settings.soundVolume}%
                            </Label>
                            <Slider
                              value={[settings.soundVolume]}
                              onValueChange={([value]) => updateSetting('soundVolume', value)}
                              max={100}
                              step={10}
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-500/10 text-purple-600 p-2 rounded-xl">
                            <Vibrate className="h-4 w-4" />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Vibration</Label>
                            <p className="text-xs text-muted-foreground">Vibrer à la réception</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.vibrationEnabled}
                          onCheckedChange={(checked) => updateSetting('vibrationEnabled', checked)}
                        />
                      </div>
                      
                      {settings.vibrationEnabled && (
                        <div className="ml-12">
                          <Label className="text-xs text-muted-foreground mb-2 block">Intensité</Label>
                          <Select 
                            value={settings.vibrationIntensity} 
                            onValueChange={(value: 'light' | 'medium' | 'strong') => updateSetting('vibrationIntensity', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">Légère</SelectItem>
                              <SelectItem value="medium">Moyenne</SelectItem>
                              <SelectItem value="strong">Forte</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-500/10 text-green-600 p-2 rounded-xl">
                          <BellRing className="h-4 w-4" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Tester les notifications</Label>
                          <p className="text-xs text-muted-foreground">Envoyer une notification test</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          haptics.medium();
                          toast.success("🔔 Notification test !", {
                            description: "Voici à quoi ressemblent vos notifications"
                          });
                        }}
                      >
                        Tester
                      </Button>
                    </div>
                  </Card>
                </>
              )}

              {/* Horaires calmes */}
              {activeTab === 'schedule' && (
                <>
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/10 text-indigo-600 p-2 rounded-xl">
                          <Moon className="h-4 w-4" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Mode silencieux</Label>
                          <p className="text-xs text-muted-foreground">Désactiver les notifications pendant certaines heures</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.quietHoursEnabled}
                        onCheckedChange={(checked) => updateSetting('quietHoursEnabled', checked)}
                      />
                    </div>

                    {settings.quietHoursEnabled && (
                      <div className="space-y-4 ml-2 mt-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground mb-1 block">Début</Label>
                            <Select 
                              value={settings.quietHoursStart} 
                              onValueChange={(value) => updateSetting('quietHoursStart', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => {
                                  const hour = i.toString().padStart(2, '0');
                                  return (
                                    <SelectItem key={hour} value={`${hour}:00`}>
                                      {hour}:00
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground mb-1 block">Fin</Label>
                            <Select 
                              value={settings.quietHoursEnd} 
                              onValueChange={(value) => updateSetting('quietHoursEnd', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => {
                                  const hour = i.toString().padStart(2, '0');
                                  return (
                                    <SelectItem key={hour} value={`${hour}:00`}>
                                      {hour}:00
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Les notifications seront silencieuses de {settings.quietHoursStart} à {settings.quietHoursEnd}
                        </p>
                      </div>
                    )}
                  </Card>

                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Pendant le mode silencieux, vous recevrez toujours les notifications mais sans son ni vibration.
                    </p>
                  </Card>
                </>
              )}

              {/* Affichage */}
              {activeTab === 'display' && (
                <>
                  <Card className="p-4 space-y-4">
                    <h3 className="font-medium text-sm flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      Aperçu des notifications
                    </h3>
                    
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-500/10 text-blue-600 p-2 rounded-xl">
                          <Eye className="h-4 w-4" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Afficher l'aperçu</Label>
                          <p className="text-xs text-muted-foreground">Voir le contenu des messages</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.showPreview}
                        onCheckedChange={(checked) => updateSetting('showPreview', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-500/10 text-green-600 p-2 rounded-xl">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Afficher le nom</Label>
                          <p className="text-xs text-muted-foreground">Voir qui vous a envoyé un message</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.showSenderName}
                        onCheckedChange={(checked) => updateSetting('showSenderName', checked)}
                      />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-500/10 text-purple-600 p-2 rounded-xl">
                          <Bell className="h-4 w-4" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Grouper les notifications</Label>
                          <p className="text-xs text-muted-foreground">Regrouper les notifications similaires</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.groupNotifications}
                        onCheckedChange={(checked) => updateSetting('groupNotifications', checked)}
                      />
                    </div>
                  </Card>

                  {/* Aperçu exemple */}
                  <Card className="p-4 bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-3">Aperçu de vos notifications :</p>
                    <div className="bg-background border rounded-lg p-3 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                          <MessageCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {settings.showSenderName ? 'Marie D.' : 'Nouveau message'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {settings.showPreview 
                              ? 'Bonjour, est-ce que l\'article est toujours disponible ?'
                              : 'Vous avez reçu un nouveau message'}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">2 min</span>
                      </div>
                    </div>
                  </Card>

                  {/* Info synchronisation */}
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <div className="flex items-start gap-3">
                      <Cloud className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-primary">Synchronisation cloud</p>
                        <p className="text-xs text-muted-foreground">
                          Vos préférences sont automatiquement sauvegardées et synchronisées sur tous vos appareils connectés à votre compte.
                        </p>
                      </div>
                    </div>
                  </Card>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer avec bouton sauvegarder */}
        <div className="border-t p-4 bg-background">
          <Button 
            onClick={handleSave} 
            className="w-full"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Synchronisation...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Enregistrer et synchroniser
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
