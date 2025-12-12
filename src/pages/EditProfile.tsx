import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, MapPin } from "lucide-react";
import { ProfileImageUpload } from "@/components/auth/ProfileImageUpload";
import { LocationAutocomplete } from "@/components/listing/LocationAutocomplete";

const EditProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    first_name: "",
    last_name: "",
    phone: "",
    location: "",
    city: "",
    country: "",
    avatar_url: ""
  });

  // Fonction pour détecter la localisation
  const detectLocation = async () => {
    if (!('geolocation' in navigator)) {
      toast.error("Géolocalisation non disponible", {
        description: "Votre navigateur ne supporte pas la géolocalisation"
      });
      return;
    }

    toast.info("Détection en cours...", {
      description: "Veuillez autoriser l'accès à votre localisation"
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
          );
          const data = await response.json();
          
          const detectedCity = data.address?.city || data.address?.town || data.address?.village || "";
          const detectedCountry = data.address?.country || "";
          
          if (detectedCity && detectedCountry) {
            setFormData(prev => ({
              ...prev,
              city: detectedCity,
              country: detectedCountry,
              location: `${detectedCity}, ${detectedCountry}`
            }));
            toast.success("Localisation détectée !", {
              description: `${detectedCity}, ${detectedCountry}`
            });
          }
        } catch (error) {
          console.error('Error fetching location details:', error);
          toast.error("Erreur de détection");
        }
      },
      () => {
        toast.error("Permission refusée");
      }
    );
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFormData({
          full_name: profile.full_name || "",
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          phone: profile.phone || "",
          location: profile.location || "",
          city: profile.city || "",
          country: profile.country || "",
          avatar_url: profile.avatar_url || ""
        });
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update(formData)
      .eq("id", userId);

    if (error) {
      toast.error("Erreur lors de la mise à jour du profil");
    } else {
      toast.success("Profil mis à jour avec succès");
      navigate("/profile");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      <div className="bg-background border-b sticky top-0 z-10 pt-safe">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-lg">Modifier le profil</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center">
              <ProfileImageUpload
                value={formData.avatar_url}
                onChange={(url) => setFormData({ ...formData, avatar_url: url || "" })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Nom complet</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Votre nom complet"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Prénom"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Nom"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="city">Ville et Pays</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={detectLocation}
                  disabled={loading}
                  className="h-8 gap-2 text-xs"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Détecter ma position</span>
                </Button>
              </div>
              <LocationAutocomplete
                value={formData.city && formData.country ? `${formData.city}, ${formData.country}` : ""}
                onChange={(value) => {
                  // Extraire ville et pays depuis la valeur sélectionnée
                  const parts = value.split(',').map(s => s.trim());
                  if (parts.length >= 2) {
                    const city = parts[0];
                    const country = parts.slice(1).join(', ');
                    setFormData({ 
                      ...formData, 
                      city,
                      country,
                      location: value
                    });
                  }
                }}
                placeholder="Ex: Dakar, Sénégal"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Tapez pour voir des suggestions ou cliquez sur "Détecter ma position"
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default EditProfile;
