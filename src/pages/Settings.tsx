import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  User,
  Heart,
  Star,
  UserCircle,
  Share2,
  Bell,
  FileText,
  Shield,
  HelpCircle,
  Globe,
  DollarSign,
  Palette,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Lock,
  Fingerprint,
  Key,
  Database,
  Trash2,
  Eye,
  UserX,
  CreditCard,
  Receipt,
  MessageCircle,
  Smartphone,
  Mail,
  CheckCircle,
  Sun,
  Moon,
  RotateCcw
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";

const Settings = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { language, setLanguage, t } = useLanguage();
  const { resetOnboarding } = useOnboarding();
  const { 
    isAvailable: isBiometricAvailable, 
    isEnabled: isBiometricEnabled, 
    enableBiometric, 
    disableBiometric,
    getBiometryName 
  } = useBiometricAuth();

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data } = await supabase
        .from("profiles")
        .select("currency")
        .eq("id", userId)
        .maybeSingle();
      
      return data;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    checkAuth();
  }, []);

  const handleToggleDarkMode = () => {
    toggleDarkMode();
    toast.success(`${t('common.mode')} ${!darkMode ? t('common.dark') : t('common.light')} ${t('common.activated')}`);
  };

  const handleBiometricToggle = async (checked: boolean) => {
    if (checked) {
      await enableBiometric();
    } else {
      disableBiometric();
    }
  };
  
  const handleLanguageChange = (lang: "fr" | "en") => {
    setLanguage(lang);
    toast.success(lang === "fr" ? "Langue changée en Français" : "Language changed to English");
  };

  const handleCurrencyChange = async (currency: string) => {
    if (!userId) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({ currency })
      .eq("id", userId);
    
    if (error) {
      toast.error("Erreur lors du changement de devise");
    } else {
      toast.success(`Devise changée en ${currency}`);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DJASSA',
          text: 'Découvrez DJASSA - Achetez et vendez facilement !',
          url: window.location.origin
        });
        toast.success('Application partagée avec succès');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(window.location.origin);
          toast.success('Lien copié dans le presse-papiers');
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast.success('Lien copié dans le presse-papiers');
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erreur lors de la déconnexion");
    } else {
      toast.success("Déconnexion réussie");
      navigate("/auth");
    }
  };

  const handleResetTutorial = () => {
    resetOnboarding();
    toast.success("Le tutoriel a été réinitialisé. Rechargez la page pour le revoir.");
  };

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
        {title}
      </h3>
      <Card className="overflow-hidden">
        {children}
      </Card>
    </div>
  );

  const SettingItem = ({ 
    icon: Icon, 
    label, 
    onClick, 
    iconColor = "bg-muted", 
    iconTextColor = "text-foreground",
    rightElement,
    showChevron = true 
  }: any) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-all active:scale-[0.98]"
    >
      <div className="flex items-center gap-3">
        <div className={`${iconColor} ${iconTextColor} p-2 rounded-xl`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {rightElement}
        {showChevron && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
      </div>
    </button>
  );

  const SettingToggle = ({ 
    icon: Icon, 
    label, 
    checked, 
    onCheckedChange,
    iconColor = "bg-muted",
    iconTextColor = "text-foreground"
  }: any) => (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className={`${iconColor} ${iconTextColor} p-2 rounded-xl`}>
          <Icon className="h-5 w-5" />
        </div>
        <Label htmlFor={label} className="text-sm font-medium cursor-pointer">{label}</Label>
      </div>
      <Switch id={label} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3 pt-safe flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Paramètres</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Compte */}
        <SettingSection title="Compte">
          <CardContent className="p-0">
            <SettingItem 
              icon={Mail} 
              label="Email" 
              onClick={() => navigate("/account-management")}
              iconColor="bg-blue-500/10"
              iconTextColor="text-blue-600"
            />
            <Separator />
            <SettingItem 
              icon={Smartphone} 
              label="Téléphone" 
              onClick={() => navigate("/account-management")}
              iconColor="bg-green-500/10"
              iconTextColor="text-green-600"
            />
            <Separator />
            <SettingItem 
              icon={CheckCircle} 
              label="Vérification du compte" 
              onClick={() => navigate("/account-management")}
              iconColor="bg-purple-500/10"
              iconTextColor="text-purple-600"
            />
            <Separator />
            <SettingItem 
              icon={Trash2} 
              label="Supprimer mon compte" 
              onClick={() => navigate("/account-management")}
              iconColor="bg-destructive/10"
              iconTextColor="text-destructive"
            />
          </CardContent>
        </SettingSection>

        {/* Sécurité et Confidentialité */}
        <SettingSection title="Sécurité et Confidentialité">
          <CardContent className="p-0">
            <SettingItem 
              icon={Key} 
              label="Mot de passe" 
              onClick={() => navigate("/settings/change-password")}
              iconColor="bg-orange-500/10"
              iconTextColor="text-orange-600"
            />
            {isBiometricAvailable && (
              <>
                <Separator />
                <SettingToggle 
                  icon={Fingerprint} 
                  label={getBiometryName()}
                  checked={isBiometricEnabled}
                  onCheckedChange={async (checked) => {
                    if (checked) {
                      await enableBiometric();
                    } else {
                      disableBiometric();
                    }
                  }}
                  iconColor="bg-red-500/10"
                  iconTextColor="text-red-600"
                />
              </>
            )}
            <Separator />
            <SettingItem 
              icon={Shield} 
              label="Authentification à deux facteurs" 
              onClick={() => navigate("/settings/two-factor")}
              iconColor="bg-indigo-500/10"
              iconTextColor="text-indigo-600"
            />
            <Separator />
            <SettingItem 
              icon={Eye} 
              label="Qui peut voir mon profil" 
              onClick={() => navigate("/settings/profile-visibility")}
              iconColor="bg-cyan-500/10"
              iconTextColor="text-cyan-600"
            />
            <Separator />
            <SettingItem 
              icon={UserX} 
              label="Utilisateurs bloqués" 
              onClick={() => navigate("/settings/blocked-users")}
              iconColor="bg-gray-500/10"
              iconTextColor="text-gray-600"
            />
          </CardContent>
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="Notifications">
          <CardContent className="p-0">
            <SettingItem 
              icon={MessageCircle} 
              label="Messages" 
              onClick={() => setNotificationDialogOpen(true)}
              iconColor="bg-green-500/10"
              iconTextColor="text-green-600"
            />
            <Separator />
            <SettingItem 
              icon={Bell} 
              label="Ventes et offres" 
              onClick={() => navigate("/settings/sales-history")}
              iconColor="bg-yellow-500/10"
              iconTextColor="text-yellow-600"
            />
            <Separator />
            <SettingItem 
              icon={Star} 
              label="Favoris et recommandations" 
              onClick={() => setNotificationDialogOpen(true)}
              iconColor="bg-pink-500/10"
              iconTextColor="text-pink-600"
            />
          </CardContent>
        </SettingSection>

        {/* Paiements */}
        <SettingSection title="Paiements">
          <CardContent className="p-0">
            <SettingItem 
              icon={Receipt} 
              label="Mes transactions" 
              onClick={() => navigate("/transactions")}
              iconColor="bg-green-500/10"
              iconTextColor="text-green-600"
            />
          </CardContent>
        </SettingSection>

        {/* Apparence */}
        <SettingSection title="Apparence">
          <CardContent className="p-0">
            <SettingToggle
              icon={darkMode ? Moon : Sun}
              label="Mode sombre"
              checked={darkMode}
              onCheckedChange={handleToggleDarkMode}
              iconColor={darkMode ? "bg-indigo-500/10" : "bg-yellow-500/10"}
              iconTextColor={darkMode ? "text-indigo-600" : "text-yellow-600"}
            />
            <Separator />
            <SettingItem 
              icon={Palette} 
              label="Thème de l'application" 
              onClick={() => toast.info("Auto / Clair / Sombre")}
              iconColor="bg-pink-500/10"
              iconTextColor="text-pink-600"
              rightElement={<span className="text-sm text-muted-foreground">Auto</span>}
            />
          </CardContent>
        </SettingSection>

        {/* Stockage et données */}
        <SettingSection title="Stockage et données">
          <CardContent className="p-0">
            <SettingItem 
              icon={Database} 
              label="Gérer le stockage" 
              onClick={() => toast.info("Cache: 45 MB")}
              iconColor="bg-teal-500/10"
              iconTextColor="text-teal-600"
              rightElement={<span className="text-sm text-muted-foreground">45 MB</span>}
            />
            <Separator />
            <SettingItem 
              icon={Trash2} 
              label="Vider le cache" 
              onClick={() => toast.success("Cache vidé avec succès")}
              iconColor="bg-red-500/10"
              iconTextColor="text-red-600"
            />
          </CardContent>
        </SettingSection>

        {/* Paramètres régionaux */}
        <SettingSection title="Région et langue">
          <CardContent className="p-0">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 text-blue-600 p-2 rounded-xl">
                    <Globe className="h-5 w-5" />
                  </div>
                  <Label className="text-sm font-medium">Langue</Label>
                </div>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/10 text-green-600 p-2 rounded-xl">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <Label className="text-sm font-medium">Devise</Label>
                </div>
                <Select 
                  value={userProfile?.currency || "FCFA"} 
                  onValueChange={handleCurrencyChange}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FCFA">FCFA</SelectItem>
                    <SelectItem value="GHS">GHS</SelectItem>
                    <SelectItem value="NGN">NGN</SelectItem>
                    <SelectItem value="GMD">GMD</SelectItem>
                    <SelectItem value="GNF">GNF</SelectItem>
                    <SelectItem value="LRD">LRD</SelectItem>
                    <SelectItem value="SLL">SLL</SelectItem>
                    <SelectItem value="CVE">CVE</SelectItem>
                    <SelectItem value="MRU">MRU</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </SettingSection>

        {/* Profil */}
        <SettingSection title="Profil">
          <CardContent className="p-0">
            <SettingItem 
              icon={User} 
              label="Ma page publique" 
              onClick={() => userId && navigate(`/seller/${userId}`)}
              iconColor="bg-purple-500/10"
              iconTextColor="text-purple-600"
            />
            <Separator />
            <SettingItem 
              icon={UserCircle} 
              label="Modifier mon profil" 
              onClick={() => navigate("/edit-profile")}
              iconColor="bg-blue-500/10"
              iconTextColor="text-blue-600"
            />
            <Separator />
            <SettingItem 
              icon={Heart} 
              label="Mes favoris" 
              onClick={() => navigate("/favorites")}
              iconColor="bg-red-500/10"
              iconTextColor="text-red-600"
            />
            <Separator />
            <SettingItem 
              icon={Share2} 
              label="Partager l'application" 
              onClick={handleShare}
              iconColor="bg-cyan-500/10"
              iconTextColor="text-cyan-600"
            />
          </CardContent>
        </SettingSection>

        {/* Centre d'aide */}
        <SettingSection title="Centre d'aide">
          <CardContent className="p-0">
            <SettingItem 
              icon={HelpCircle} 
              label="FAQ" 
              onClick={() => navigate("/settings/faq")}
              iconColor="bg-indigo-500/10"
              iconTextColor="text-indigo-600"
            />
            <Separator />
            <SettingItem 
              icon={Shield} 
              label="Règles de la communauté" 
              onClick={() => navigate("/settings/community-guidelines")}
              iconColor="bg-blue-500/10"
              iconTextColor="text-blue-600"
            />
            <Separator />
            <SettingItem 
              icon={Star} 
              label="Badges vendeurs" 
              onClick={() => navigate("/settings/seller-badges")}
              iconColor="bg-yellow-500/10"
              iconTextColor="text-yellow-600"
            />
            <Separator />
            <SettingItem 
              icon={MessageCircle} 
              label="Contacter le support"
              onClick={() => navigate("/settings/support")}
              iconColor="bg-green-500/10"
              iconTextColor="text-green-600"
            />
            <Separator />
            <SettingItem 
              icon={Shield} 
              label="Signaler un problème" 
              onClick={() => navigate("/settings/report")}
              iconColor="bg-orange-500/10"
              iconTextColor="text-orange-600"
            />
            <Separator />
            <SettingItem 
              icon={FileText} 
              label="Conditions générales" 
              onClick={() => navigate("/settings/terms")}
              iconColor="bg-gray-500/10"
              iconTextColor="text-gray-600"
            />
            <Separator />
            <SettingItem 
              icon={Lock} 
              label="Politique de confidentialité" 
              onClick={() => navigate("/settings/privacy")}
              iconColor="bg-gray-500/10"
              iconTextColor="text-gray-600"
            />
            <Separator />
            <SettingItem 
              icon={RotateCcw} 
              label="Réinitialiser le tutoriel" 
              onClick={handleResetTutorial}
              iconColor="bg-purple-500/10"
              iconTextColor="text-purple-600"
            />
          </CardContent>
        </SettingSection>

        {/* Déconnexion */}
        <SettingSection title="">
          <CardContent className="p-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-4 text-destructive hover:bg-destructive/10 transition-all active:scale-[0.98]"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-semibold">Se déconnecter</span>
            </button>
          </CardContent>
        </SettingSection>

        <div className="text-center py-4 space-y-1">
          <p className="text-xs text-muted-foreground">Version 1.0.0</p>
          <Button 
            variant="link" 
            size="sm" 
            className="text-xs"
            onClick={() => toast.info("Vous utilisez la dernière version")}
          >
            Rechercher des mises à jour
          </Button>
        </div>
      </div>

      <NotificationSettings
        open={notificationDialogOpen}
        onOpenChange={setNotificationDialogOpen}
      />

      <BottomNav />
    </div>
  );
};

export default Settings;
