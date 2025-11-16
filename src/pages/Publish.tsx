import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploader } from "@/components/listing/ImageUploader";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft } from "lucide-react";
import { PublishTutorial } from "@/components/onboarding/PublishTutorial";
import { useOnboarding } from "@/hooks/useOnboarding";

const Publish = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { firstPublishCompleted, completeFirstPublish } = useOnboarding();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category_id: "",
    subcategory_id: "",
    location: "",
    condition: "new",
    images: [] as string[],
    isFree: false,
    delivery_available: false,
    delivery_price: "",
    delivery_zone: "",
    phone: "",
    phone_visible: false,
    whatsapp_available: false,
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        throw new Error("Non authentifié");
      }
      return user;
    },
  });

  // Fetch user profile to get country, city and phone
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("country, city, phone")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('listing_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        const draftAge = Date.now() - draft.timestamp;
        // Only load draft if less than 24 hours old
        if (draftAge < 24 * 60 * 60 * 1000) {
          setFormData(draft.data);
          setParentCategoryId(draft.parentCategoryId || "");
          toast({
            title: "Brouillon restauré",
            description: "Votre brouillon a été chargé",
          });
        } else {
          localStorage.removeItem('listing_draft');
        }
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }
  }, []);

  // Auto-fill location and phone when profile is loaded
  useEffect(() => {
    if (profile && profile.city && profile.country && !formData.location) {
      setFormData(prev => ({
        ...prev,
        location: `${profile.city}, ${profile.country}`,
        phone: profile.phone || ""
      }));
    }
  }, [profile]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.title || formData.description) {
        localStorage.setItem('listing_draft', JSON.stringify({
          data: formData,
          parentCategoryId,
          timestamp: Date.now()
        }));
        setLastSaved(new Date());
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [formData, parentCategoryId]);

  // Real-time validation
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case "title":
        if (value.length < 10) {
          newErrors.title = "Le titre doit contenir au moins 10 caractères";
        } else {
          delete newErrors.title;
        }
        break;
      case "description":
        if (value.length < 20) {
          newErrors.description = "La description doit contenir au moins 20 caractères";
        } else if (value.length > 500) {
          newErrors.description = "La description ne peut pas dépasser 500 caractères";
        } else {
          delete newErrors.description;
        }
        break;
      case "price":
        if (!formData.isFree) {
          const priceNum = parseFloat(value);
          if (isNaN(priceNum) || priceNum <= 0) {
            newErrors.price = "Le prix doit être un nombre positif";
          } else {
            delete newErrors.price;
          }
        } else {
          delete newErrors.price;
        }
        break;
      case "location":
        if (value.length < 3) {
          newErrors.location = "Veuillez entrer une localisation valide";
        } else {
          delete newErrors.location;
        }
        break;
      case "category_id":
        if (!value) {
          newErrors.category_id = "Veuillez sélectionner une catégorie";
        } else {
          delete newErrors.category_id;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  // Fetch parent categories
  const { data: parentCategories } = useQuery({
    queryKey: ["parent-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .is("parent_id", null)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch subcategories based on parent selection
  const { data: subcategories } = useQuery({
    queryKey: ["subcategories", parentCategoryId],
    queryFn: async () => {
      if (!parentCategoryId) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("parent_id", parentCategoryId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!parentCategoryId,
  });

  const handleParentCategoryChange = (value: string) => {
    setParentCategoryId(value);
    setFormData(prev => ({ ...prev, category_id: value, subcategory_id: "" }));
  };

  const handleSubcategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category_id: value, subcategory_id: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour publier",
        variant: "destructive",
      });
      return;
    }

    if (!acceptedTerms) {
      toast({
        title: "Conditions requises",
        description: "Vous devez accepter les conditions d'utilisation",
        variant: "destructive",
      });
      return;
    }

    // Validate all fields
    validateField("title", formData.title);
    validateField("description", formData.description);
    validateField("price", formData.price);
    validateField("location", formData.location);
    validateField("category_id", formData.category_id);

    if (Object.keys(errors).length > 0) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive",
      });
      return;
    }

    if (formData.images.length === 0) {
      toast({
        title: "Images requises",
        description: "Ajoutez au moins une photo de votre article",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("listings").insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        price: formData.isFree ? 0 : parseFloat(formData.price),
        category_id: formData.subcategory_id || formData.category_id,
        location: formData.location,
        condition: formData.condition,
        images: formData.images,
        status: "active",
        delivery_available: formData.delivery_available,
        delivery_price: formData.delivery_available && formData.delivery_price ? parseFloat(formData.delivery_price) : null,
        delivery_zone: formData.delivery_available ? formData.delivery_zone : null,
        phone: formData.phone || null,
        phone_visible: formData.phone_visible,
        whatsapp_available: formData.whatsapp_available,
      });

      if (error) throw error;

      // Clear draft after successful submission
      localStorage.removeItem('listing_draft');

      toast({
        title: "Annonce publiée !",
        description: "Votre annonce est maintenant en ligne",
      });

      navigate("/");
    } catch (error) {
      console.error("Publish error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de publier l'annonce",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-muted/30">
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Publier une annonce</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="images">Photos * (Max 10)</Label>
                <ImageUploader
                  images={formData.images}
                  onImagesChange={(images) =>
                    setFormData({ ...formData, images })
                  }
                  maxImages={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Ex: iPhone 13 Pro Max 256GB"
                  required
                  maxLength={100}
                  className={errors.title ? "border-destructive" : formData.title.length >= 10 ? "border-green-500" : ""}
                />
                {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
                {formData.title.length > 0 && <p className="text-sm text-muted-foreground mt-1">{formData.title.length} caractères</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Décrivez votre article en détail..."
                  required
                  rows={5}
                  maxLength={500}
                  className={errors.description ? "border-destructive" : formData.description.length >= 20 ? "border-green-500" : ""}
                />
                {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
                <p className="text-sm text-muted-foreground mt-1">{formData.description.length}/500 caractères</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2" data-tutorial="category-select">
                  <Label htmlFor="category">Catégorie principale *</Label>
                  <Select
                    value={parentCategoryId}
                    onValueChange={handleParentCategoryChange}
                    required
                  >
                    <SelectTrigger className={errors.category_id ? "border-destructive" : parentCategoryId ? "border-green-500" : ""}>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentCategories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && <p className="text-sm text-destructive mt-1">{errors.category_id}</p>}
                </div>

                {subcategories && subcategories.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Sous-catégorie</Label>
                    <Select
                      value={formData.subcategory_id}
                      onValueChange={handleSubcategoryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Affiner (optionnel)" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2" data-tutorial="price-input">
                  <Label htmlFor="price">Prix (FCFA) {!formData.isFree && "*"}</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.isFree ? "0" : formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="50000"
                    required={!formData.isFree}
                    min="0"
                    step="1000"
                    disabled={formData.isFree}
                    className={formData.isFree ? "bg-muted" : errors.price ? "border-destructive" : formData.price && parseFloat(formData.price) > 0 ? "border-green-500" : ""}
                  />
                  {errors.price && <p className="text-sm text-destructive mt-1">{errors.price}</p>}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFree"
                  checked={formData.isFree}
                  onCheckedChange={(checked) => {
                    setFormData({ ...formData, isFree: checked as boolean, price: checked ? "0" : "" });
                    if (checked) {
                      const newErrors = { ...errors };
                      delete newErrors.price;
                      setErrors(newErrors);
                    }
                  }}
                />
                <Label htmlFor="isFree" className="cursor-pointer font-normal">
                  Article gratuit / À donner
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2" data-tutorial="location-input">
                  <Label htmlFor="location">Localisation *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Ex: Dakar, Sénégal"
                    required
                    maxLength={100}
                    className={errors.location ? "border-destructive" : formData.location.length >= 3 ? "border-green-500" : ""}
                  />
                  {errors.location && <p className="text-sm text-destructive mt-1">{errors.location}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Modifiable - Entrez votre ville et pays</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">État *</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) =>
                      setFormData({ ...formData, condition: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Neuf</SelectItem>
                      <SelectItem value="like_new">Comme neuf</SelectItem>
                      <SelectItem value="good">Bon état</SelectItem>
                      <SelectItem value="fair">État moyen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Section Livraison */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold">Options de livraison</h3>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delivery_available"
                    checked={formData.delivery_available}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, delivery_available: checked as boolean })
                    }
                  />
                  <Label htmlFor="delivery_available" className="cursor-pointer font-normal">
                    Livraison possible
                  </Label>
                </div>

                {formData.delivery_available && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <div className="space-y-2">
                      <Label htmlFor="delivery_price">Frais de livraison (FCFA)</Label>
                      <Input
                        id="delivery_price"
                        type="number"
                        value={formData.delivery_price}
                        onChange={(e) => setFormData({ ...formData, delivery_price: e.target.value })}
                        placeholder="Ex: 2000"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery_zone">Zone de livraison</Label>
                      <Select
                        value={formData.delivery_zone}
                        onValueChange={(value) => setFormData({ ...formData, delivery_zone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="city">Ville uniquement</SelectItem>
                          <SelectItem value="region">Toute la région</SelectItem>
                          <SelectItem value="country">Tout le pays</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {!formData.delivery_available && (
                  <p className="text-sm text-muted-foreground ml-6">
                    ☑️ Remise en main propre uniquement
                  </p>
                )}
              </div>

              {/* Section Téléphone */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold">Contact</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Numéro de téléphone (optionnel)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ex: +225 01 02 03 04 05"
                  />
                </div>

                {formData.phone && (
                  <div className="space-y-2 ml-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="phone_visible"
                        checked={formData.phone_visible}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, phone_visible: checked as boolean })
                        }
                      />
                      <Label htmlFor="phone_visible" className="cursor-pointer font-normal">
                        Afficher mon numéro dans l'annonce
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="whatsapp_available"
                        checked={formData.whatsapp_available}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, whatsapp_available: checked as boolean })
                        }
                      />
                      <Label htmlFor="whatsapp_available" className="cursor-pointer font-normal">
                        WhatsApp disponible sur ce numéro
                      </Label>
                    </div>
                  </div>
                )}
              </div>

              {/* Section CGU */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    required
                  />
                  <Label htmlFor="acceptTerms" className="cursor-pointer font-normal text-sm leading-relaxed">
                    En publiant, vous acceptez nos{" "}
                    <a href="/terms" className="text-primary hover:underline">
                      Conditions d'utilisation
                    </a>{" "}
                    et notre{" "}
                    <a href="/help" className="text-primary hover:underline">
                      Politique de publication
                    </a>. 
                    Votre annonce sera modérée avant publication.
                  </Label>
                </div>
              </div>

              {lastSaved && (
                <p className="text-xs text-muted-foreground text-center">
                  Brouillon sauvegardé à {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !acceptedTerms}
                size="lg"
              >
                {isSubmitting ? "Publication..." : "Publier l'annonce"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <PublishTutorial
        active={!firstPublishCompleted}
        onComplete={completeFirstPublish}
      />
      
      <BottomNav />
    </div>
  );
};

export default Publish;
