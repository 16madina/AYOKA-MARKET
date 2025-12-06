import { useState, useEffect, useRef } from "react";
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
import { Eye, EyeOff, ArrowLeft, MapPin, Chrome } from "lucide-react";
import ayokaLogo from "@/assets/ayoka-logo.png";

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
  
  // Use refs for text inputs to avoid re-renders on every keystroke
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  // Keep state only for select fields and avatar (which need to trigger UI updates)
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const selectedCountry = allCountries.find((c) => c.code === country);
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
              setCountry(matchingCountry.code);
              setCity(detectedCity || "");
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
            
            // Pré-remplir le pays si détecté
            if (detectedCountry) {
              const matchingCountry = allCountries.find(c => 
                c.name.toLowerCase() === detectedCountry.toLowerCase()
              );
              if (matchingCountry) {
                setCountry(matchingCountry.code);
                setCity(detectedCity || "");
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

  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("OAuth error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la connexion",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Get values from refs
    const email = emailRef.current?.value || "";
    const password = passwordRef.current?.value || "";
    const confirmPassword = confirmPasswordRef.current?.value || "";
    const firstName = firstNameRef.current?.value || "";
    const lastName = lastNameRef.current?.value || "";
    const phone = phoneRef.current?.value || "";

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur AYOKA MARKET !",
        });
        navigate("/");
      } else {
        // Sign up validation
        if (password !== confirmPassword) {
          toast({
            title: "Erreur",
            description: "Les mots de passe ne correspondent pas",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
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

        const fullPhone = phone ? `${dialCode}${phone}` : "";

        // Sign up - Envoyer TOUTES les données dans raw_user_meta_data
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`,
              phone: fullPhone,
              avatar_url: avatarUrl,
              country: selectedCountry?.name,
              city: city,
            },
          },
        });

        if (error) throw error;

        if (!data.user) {
          throw new Error("Erreur lors de la création du compte");
        }
        
        // Send verification email
        try {
          const confirmationUrl = `${window.location.origin}/auth/confirm`;
          const emailResult = await supabase.functions.invoke('send-verification-email', {
            body: {
              email,
              confirmationUrl,
              userName: firstName
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

  // Clear refs when switching between login/signup
  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setAcceptTerms(false);
    // Clear input values
    if (emailRef.current) emailRef.current.value = "";
    if (passwordRef.current) passwordRef.current.value = "";
    if (confirmPasswordRef.current) confirmPasswordRef.current.value = "";
    if (firstNameRef.current) firstNameRef.current.value = "";
    if (lastNameRef.current) lastNameRef.current.value = "";
    if (phoneRef.current) phoneRef.current.value = "";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-2xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="mb-4"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src={ayokaLogo} 
                alt="AYOKA MARKET" 
                className="h-16 w-auto object-contain"
              />
            </div>
            <CardTitle className="text-2xl">
              {isLogin ? "Connexion" : "Créer un compte"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Connectez-vous à votre compte AYOKA MARKET"
                : "Rejoignez la communauté AYOKA MARKET"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* OAuth Button */}
            <div className="mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => handleOAuthSignIn('google')}
                disabled={isLoading}
              >
                <Chrome className="h-5 w-5" />
                Continuer avec Google
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continuer avec email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <>
                  <ProfileImageUpload
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    disabled={isLoading}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom *</Label>
                      <Input
                        id="firstName"
                        ref={firstNameRef}
                        defaultValue=""
                        placeholder="Jean"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom *</Label>
                      <Input
                        id="lastName"
                        ref={lastNameRef}
                        defaultValue=""
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
                      value={country}
                      onValueChange={(value) => {
                        setCountry(value);
                        setCity("");
                      }}
                      required
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un pays" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCountries.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            <span className="flex items-center gap-2">
                              <span className="text-xl">{c.flag}</span>
                              {c.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {country && (
                    <div className="space-y-2">
                      <Label htmlFor="city">Ville *</Label>
                      <Select
                        value={city}
                        onValueChange={setCity}
                        required
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une ville" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCountry?.cities.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
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
                        ref={phoneRef}
                        defaultValue=""
                        placeholder="771234567"
                        required
                        disabled={isLoading || !country}
                        onInput={(e) => {
                          // Only allow digits
                          const target = e.target as HTMLInputElement;
                          target.value = target.value.replace(/\D/g, "");
                        }}
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
                  ref={emailRef}
                  defaultValue=""
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
                    ref={passwordRef}
                    defaultValue=""
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
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
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
                      ref={confirmPasswordRef}
                      defaultValue=""
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
                      aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
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
                  onClick={handleModeSwitch}
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
