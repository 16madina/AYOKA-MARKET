import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
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

const Settings = () => {
  const navigate = useNavigate();

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
            onClick={() => toast.info("Fonctionnalité à venir")}
          />
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="overflow-hidden">
            <button
              onClick={() => toast.info("Fonctionnalité à venir")}
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
              onClick={() => toast.info("Fonctionnalité à venir")}
              highlight={true}
            />
            <div className="border-t" />
            <SettingItem
              icon={Share2}
              label="Liens vers les médias sociaux"
              onClick={() => toast.info("Fonctionnalité à venir")}
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
              onClick={() => toast.info("Fonctionnalité à venir")}
            />
            <div className="border-t" />
            <SettingItem
              icon={Bell}
              label="Préférences de notifications"
              onClick={() => toast.info("Fonctionnalité à venir")}
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
              onClick={() => toast.info("Fonctionnalité à venir")}
            />
            <div className="border-t" />
            <SettingItem
              icon={Shield}
              label="Politique de confidentialité"
              onClick={() => toast.info("Fonctionnalité à venir")}
            />
            <div className="border-t" />
            <SettingItem
              icon={HelpCircle}
              label="Aide"
              onClick={() => toast.info("Fonctionnalité à venir")}
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
                <span className="font-medium">Langue</span>
              </div>
              <Select defaultValue="fr">
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <span>🇫🇷</span>
                      <span>Français</span>
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
          <Card className="overflow-hidden">
            <SettingItem
              icon={Palette}
              label="Thème de l'application"
              onClick={() => toast.info("Fonctionnalité à venir")}
            />
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

      <BottomNav />
    </div>
  );
};

export default Settings;
