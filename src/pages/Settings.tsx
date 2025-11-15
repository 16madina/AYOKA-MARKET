import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  User,
  Heart,
  Bookmark,
  Star,
  UserCircle,
  Share2,
  Settings as SettingsIcon,
  Bell,
  FileText,
  Shield,
  HelpCircle,
  Globe,
  DollarSign,
  Palette,
  LogOut,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { NotificationSettings } from "@/components/settings/NotificationSettings";

const Settings = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { language, setLanguage, t } = useLanguage();

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
  
  const handleLanguageChange = (lang: "fr" | "en") => {
    setLanguage(lang);
    toast.success(lang === "fr" ? "Langue changée en Français" : "Language changed to English");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ReVivo',
          text: 'Découvrez ReVivo - Achetez et vendez facilement !',
          url: window.location.origin
        });
      } catch (err) {
        console.log('Erreur de partage:', err);
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

  const SettingItem = ({ icon: Icon, label, onClick, highlight = false }: any) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${
        highlight ? "bg-orange-100/80 hover:bg-orange-100" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${highlight ? "text-orange-600" : "text-muted-foreground"}`} />
        <span className={highlight ? "font-medium" : ""}>{label}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  );

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg" />
            <span className="font-bold text-xl">ReVivo</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Links */}
        <Card className="overflow-hidden">
          <SettingItem
            icon={User}
            label="Ma page publique"
            onClick={() => userId ? navigate(`/seller/${userId}`) : navigate("/auth")}
          />
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="overflow-hidden">
            <button
              onClick={() => navigate("/favorites")}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Favoris</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </Card>
          
          <Card className="overflow-hidden">
            <button
              onClick={() => toast.info("Fonctionnalité à venir")}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Bookmark className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Recherches sauvegardées</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <SettingItem
            icon={Star}
            label="Mes avis"
            onClick={() => toast.info("Fonctionnalité à venir")}
          />
        </Card>

        {/* Détails du profil */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground px-1">Détails du profil</h2>
          <Card className="overflow-hidden">
            <SettingItem
              icon={UserCircle}
              label="Détails personnels"
              onClick={() => navigate("/edit-profile")}
              highlight={true}
            />
            <div className="border-t" />
            <SettingItem
              icon={Share2}
              label="Partager ReVivo"
              onClick={handleShare}
            />
          </Card>
        </div>

        {/* Paramètres du compte */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground px-1">Paramètres du compte</h2>
          <Card className="overflow-hidden">
            <SettingItem
              icon={SettingsIcon}
              label="Gérer le compte"
              onClick={() => navigate("/account-management")}
            />
            <div className="border-t" />
            <SettingItem
              icon={Bell}
              label="Préférences de notifications"
              onClick={() => setNotificationDialogOpen(true)}
            />
          </Card>
        </div>

        {/* Informations générales */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground px-1">Informations générales</h2>
          <Card className="overflow-hidden">
            <SettingItem
              icon={FileText}
              label="Conditions d'utilisation"
              onClick={() => navigate("/auth?view=terms")}
            />
            <div className="border-t" />
            <SettingItem
              icon={Shield}
              label="Politique de confidentialité"
              onClick={() => navigate("/auth?view=privacy")}
            />
            <div className="border-t" />
            <SettingItem
              icon={HelpCircle}
              label="Aide"
              onClick={() => navigate("/help")}
            />
          </Card>
        </div>

        {/* Paramètres régionaux */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground px-1">Paramètres régionaux</h2>
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{t('settings.language')}</span>
              </div>
              <p className="text-sm text-muted-foreground">{t('settings.language_description')}</p>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <span>{language === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
                      <span>{language === 'fr' ? 'Français' : 'English'}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">
                    <div className="flex items-center gap-2">
                      <span>🇫🇷</span>
                      <span>Français</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="en">
                    <div className="flex items-center gap-2">
                      <span>🇬🇧</span>
                      <span>English</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Devise</span>
              </div>
              <Select defaultValue="fcfa">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fcfa">FCFA - Franc CFA</SelectItem>
                  <SelectItem value="eur">EUR - Euro</SelectItem>
                  <SelectItem value="usd">USD - Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

        {/* Paramètres d'affichage */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground px-1">Paramètres d'affichage</h2>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Mode sombre</span>
              </div>
              <Switch checked={darkMode} onCheckedChange={handleToggleDarkMode} />
            </div>
          </Card>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Se déconnecter
        </Button>

        {/* Version */}
        <div className="text-center text-sm text-muted-foreground py-4">
          Version 19.70.1
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
