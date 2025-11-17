import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ProfileImageUpload } from "@/components/auth/ProfileImageUpload";
import { PrivacyPolicy } from "@/components/auth/PrivacyPolicy";
import { TermsConditions } from "@/components/auth/TermsConditions";
import { allCountries } from "@/data/westAfricaData";
import { Eye, EyeOff, ArrowLeft, MapPin } from "lucide-react";
import djassaLogoAuth from "@/assets/djassa-logo-auth.png";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(location.state?.mode !== 'signup');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsConditions, setShowTermsConditions] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<{ city: string | null; country: string | null }>({ city: null, country: null });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    country: "",
    city: "",
    phone: "",
    avatar_url: null as string | null,
  });

  const selectedCountry = allCountries.find((c) => c.code === formData.country);
  const dialCode = selectedCountry?.dialCode || "";

  // Fonction pour détecter la localisation manuellement
  const detectLocation = async () => {
    if (!('geolocation' in navigator)) {
      toast({
        title: "Géolocalisation non disponible",
        description: "Votre navigateur ne supporte pas la géolocalisation",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Détection en cours...",
      description: "Veuillez autoriser l'accès à votre localisation",
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
          );
          const data = await response.json();
          
          const detectedCity = data.address?.city || data.address?.town || data.address?.village || null;
          const detectedCountry = data.address?.country || null;
          
          if (detectedCountry) {
            const matchingCountry = allCountries.find(c => 
              c.name.toLowerCase() === detectedCountry.toLowerCase()
            );
            if (matchingCountry) {
              setFormData(prev => ({
                ...prev,
                country: matchingCountry.code,
                city: detectedCity || ""
              }));
              toast({
                title: "Localisation détectée !",
                description: `${detectedCity}, ${detectedCountry}`,
              });
            } else {
              toast({
                title: "Pays non trouvé",
                description: "Veuillez sélectionner votre pays manuellement",
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          console.error('Error fetching location details:', error);
          toast({
            title: "Erreur de détection",
            description: "Impossible de détecter votre localisation",
            variant: "destructive",
          });
        }
      },
      (error) => {
        console.log('Geolocation permission denied:', error);
        toast({
          title: "Permission refusée",
          description: "Veuillez autoriser l'accès à votre localisation",
          variant: "destructive",
        });
      }
    );
  };

  // Détecter automatiquement la localisation de l'utilisateur
  useEffect(() => {
    if (isLogin) return; // Ne détecte que pour l'inscription

    // Utiliser l'API de géolocalisation du navigateur
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Utiliser une API de reverse geocoding (OpenStreetMap Nominatim)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
            );
            const data = await response.json();
            
            const detectedCity = data.address?.city || data.address?.town || data.address?.village || null;
            const detectedCountry = data.address?.country || null;
            
            setDetectedLocation({ city: detectedCity, country: detectedCountry });
            
            // Pré-remplir le pays si détecté
            if (detectedCountry) {
              const matchingCountry = allCountries.find(c => 
                c.name.toLowerCase() === detectedCountry.toLowerCase()
              );
              if (matchingCountry) {
                setFormData(prev => ({
                  ...prev,
                  country: matchingCountry.code,
                  city: detectedCity || ""
                }));
              }
            }
          } catch (error) {
            console.error('Error fetching location details:', error);
          }
        },
        (error) => {
          console.log('Geolocation permission denied or not available:', error);
        }
      );
    }
  }, [isLogin]);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur DJASSA !",
        });
        navigate("/");
      } else {
        // Sign up validation
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Erreur",
            description: "Les mots de passe ne correspondent pas",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          toast({
            title: "Erreur",
            description: "Le mot de passe doit contenir au moins 6 caractères",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (!acceptTerms) {
          toast({
            title: "Erreur",
            description: "Vous devez accepter les politiques de confidentialité et les conditions générales",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const fullPhone = formData.phone ? `${dialCode}${formData.phone}` : "";

        // Sign up
        const { error, data } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              full_name: `${formData.firstName} ${formData.lastName}`,
            },
          },
        });

        if (error) throw error;

        // Update profile with additional data
        if (data.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              first_name: formData.firstName,
              last_name: formData.lastName,
              full_name: `${formData.firstName} ${formData.lastName}`,
              country: selectedCountry?.name,
              city: formData.city,
              phone: fullPhone,
              location: `${formData.city}, ${selectedCountry?.name}`,
              avatar_url: formData.avatar_url,
            })
            .eq("id", data.user.id);

          if (profileError) console.error("Profile update error:", profileError);
          
          // Send verification email
          try {
            const confirmationUrl = `${window.location.origin}/auth/confirm`;
            const emailResult = await supabase.functions.invoke('send-verification-email', {
              body: {
                email: formData.email,
                confirmationUrl,
                userName: formData.firstName
              }
            });
            if (emailResult.error) {
              console.error("Error sending verification email:", emailResult.error);
            } else {
              console.log("Verification email sent successfully");
            }
          } catch (emailError) {
            console.error("Error sending verification email:", emailError);
          }
        }

        toast({
          title: "Compte créé !",
          description: "Vérifiez votre email pour obtenir votre badge vérifié ✓",
        });
        navigate("/");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-2xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src={djassaLogoAuth} 
                alt="DJASSA" 
                className="h-12 w-auto"
              />
            </div>
            <CardTitle className="text-2xl">
              {isLogin ? "Connexion" : "Créer un compte"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Connectez-vous à votre compte DJASSA"
                : "Rejoignez la communauté DJASSA"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <>
                  <ProfileImageUpload
                    value={formData.avatar_url}
                    onChange={(url) => setFormData({ ...formData, avatar_url: url })}
                    disabled={isLoading}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        placeholder="Jean"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        placeholder="Dupont"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="country">Pays *</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={detectLocation}
                        disabled={isLoading}
                        className="h-8 gap-2 text-xs"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Détecter ma position</span>
                      </Button>
                    </div>
                    <Select
                      value={formData.country}
                      onValueChange={(value) =>
                        setFormData({ ...formData, country: value, city: "" })
                      }
                      required
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un pays" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCountries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <span className="flex items-center gap-2">
                              <span className="text-xl">{country.flag}</span>
                              {country.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.country && (
                    <div className="space-y-2">
                      <Label htmlFor="city">Ville *</Label>
                      <Select
                        value={formData.city}
                        onValueChange={(value) =>
                          setFormData({ ...formData, city: value })
                        }
                        required
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une ville" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCountry?.cities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone *</Label>
                    <div className="flex gap-2">
                      <Input
                        value={dialCode}
                        disabled
                        className="w-24 bg-muted"
                      />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })
                        }
                        placeholder="771234567"
                        required
                        disabled={isLoading || !formData.country}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="exemple@email.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {!isLogin && (
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    disabled={isLoading}
                    className="mt-1"
                  />
                  <div className="text-sm leading-none">
                    <label
                      htmlFor="terms"
                      className="text-muted-foreground cursor-pointer"
                    >
                      J'accepte les{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowPrivacyPolicy(true);
                        }}
                        className="text-primary hover:underline font-medium"
                      >
                        politiques de confidentialité
                      </button>
                      {" "}et les{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowTermsConditions(true);
                        }}
                        className="text-primary hover:underline font-medium"
                      >
                        conditions générales
                      </button>
                    </label>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading
                  ? "Chargement..."
                  : isLogin
                  ? "Se connecter"
                  : "Créer mon compte"}
              </Button>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  {isLogin
                    ? "Pas encore de compte ?"
                    : "Déjà un compte ?"}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setAcceptTerms(false);
                  }}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLogin ? "Créer un compte" : "Se connecter"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <PrivacyPolicy open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy} />
      <TermsConditions open={showTermsConditions} onOpenChange={setShowTermsConditions} />
    </div>
  );
};

export default Auth;
