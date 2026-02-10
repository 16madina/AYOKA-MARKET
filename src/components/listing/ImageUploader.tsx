import { useState } from "react";
import { X, Upload, Image as ImageIcon, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCamera } from "@/hooks/useCamera";
import { errorTracker } from "@/utils/errorTracking";
import { performanceMonitor } from "@/utils/performanceMetrics";

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

// Fonction pour modérer une image via l'edge function
const moderateImage = async (imageUrl: string, userId?: string): Promise<{ safe: boolean; flagged?: boolean; reason?: string }> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moderate-image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ imageUrl, userId }),
      }
    );

    if (!response.ok) {
      console.error("Moderation request failed:", response.status);
      return { safe: true, flagged: false };
    }

    return await response.json();
  } catch (error) {
    console.error("Moderation error:", error);
    return { safe: true, flagged: false };
  }
};

export const ImageUploader = ({ images, onImagesChange, maxImages = 10, onFlaggedImages }: ImageUploaderProps & { onFlaggedImages?: (flagged: boolean) => void }) => {
  const [uploading, setUploading] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const { pickFromGallery, isLoading: cameraLoading } = useCamera();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + images.length > maxImages) {
      toast({
        title: "Limite atteinte",
        description: `Vous ne pouvez télécharger que ${maxImages} images maximum`,
        variant: "destructive",
      });
      return;
    }

    await handleUpload(files);
  };

  const handleCameraUpload = async () => {
    try {
      const file = await pickFromGallery();
      if (file) {
        await handleUpload([file]);
      }
    } catch (error: any) {
      errorTracker.logError('camera', 'Failed to select from gallery', error);
      
      let errorMessage = "Impossible d'accéder à vos photos.";
      
      // Erreur de permissions spécifique
      if (error?.message?.includes('permission') || error?.message?.includes('denied')) {
        errorMessage = "Accès refusé. Vérifiez les permissions de l'application dans les réglages de votre appareil.";
      }
      
      toast({
        title: "Erreur d'accès à la galerie",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    performanceMonitor.startMeasure('image-upload', { fileCount: files.length });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Connexion requise",
          description: "Vous devez être connecté pour ajouter des photos. Veuillez vous reconnecter.",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      // Validation des fichiers avant upload
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      const maxSizeInBytes = 5 * 1024 * 1024; // 5 Mo

      for (const file of files) {
        // Vérifier la taille
        if (file.size > maxSizeInBytes) {
          const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
          toast({
            title: "Image trop volumineuse",
            description: `"${file.name}" fait ${sizeInMB} Mo. La taille maximum est de 5 Mo. Essayez une photo plus petite.`,
            variant: "destructive",
          });
          setUploading(false);
          return;
        }
        
        // Vérifier le format
        if (!validTypes.includes(file.type.toLowerCase())) {
          toast({
            title: "Format non supporté",
            description: `"${file.name}" n'est pas un format supporté. Utilisez JPG, PNG ou WEBP.`,
            variant: "destructive",
          });
          setUploading(false);
          return;
        }
      }

      // Upload 2-3 images à la fois (throttling)
      const chunks: File[][] = [];
      for (let i = 0; i < files.length; i += 2) {
        chunks.push(files.slice(i, i + 2));
      }

      const newImages: string[] = [];

      for (const chunk of chunks) {
        const uploadPromises = chunk.map(async (file, idx) => {
          try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}/${Date.now()}_${idx}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from("listings")
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from("listings")
              .getPublicUrl(fileName);

            return { publicUrl, fileName, originalName: file.name };
          } catch (error) {
            errorTracker.logError('upload', `Failed to upload ${file.name}`, error as Error);
            throw error;
          }
        });

        const chunkResults = await Promise.all(uploadPromises);
        
        // Modération des images uploadées (ne bloque plus, signale seulement)
        setModerating(true);
        let hasFlaggedImages = false;
        for (const result of chunkResults) {
          const moderation = await moderateImage(result.publicUrl, user.id);
          newImages.push(result.publicUrl);
          
          if (moderation.flagged) {
            hasFlaggedImages = true;
            console.warn("Image flagged for review:", result.originalName, moderation.reason);
          }
        }
        if (hasFlaggedImages) {
          onFlaggedImages?.(true);
        }
        setModerating(false);
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast({
          title: "Images téléchargées",
          description: `${newImages.length} image(s) ajoutée(s) avec succès`,
        });
      } else {
        toast({
          title: "Aucune image ajoutée",
          description: "Veuillez réessayer",
          variant: "destructive",
        });
      }

      performanceMonitor.endMeasure('image-upload');
    } catch (error: any) {
      console.error("Upload error:", error);
      errorTracker.logError('upload', 'Batch upload failed', error as Error);
      
      // Détection intelligente du type d'erreur
      let errorTitle = "Échec de l'envoi";
      let errorMessage = "Une erreur inattendue s'est produite";
      
      // Erreur d'authentification
      if (error?.message?.includes('JWT') || error?.message?.includes('auth') || error?.status === 401) {
        errorTitle = "Session expirée";
        errorMessage = "Votre session a expiré. Veuillez vous reconnecter pour continuer.";
      } 
      // Erreur réseau/connexion
      else if (error?.message?.includes('network') || error?.message?.includes('fetch') || error?.message?.includes('Failed to fetch')) {
        errorTitle = "Problème de connexion";
        errorMessage = "Vérifiez votre connexion internet et réessayez.";
      }
      // Erreur de stockage
      else if (error?.message?.includes('storage') || error?.status === 500 || error?.statusCode === 500) {
        errorTitle = "Erreur de stockage";
        errorMessage = "Erreur serveur. Veuillez réessayer dans quelques instants.";
      }
      // Fichier trop gros (erreur serveur)
      else if (error?.status === 413 || error?.statusCode === 413) {
        errorTitle = "Image trop volumineuse";
        errorMessage = "L'image est trop volumineuse pour être envoyée. Réduisez la taille de votre photo.";
      }
      // Erreur de permissions
      else if (error?.status === 403 || error?.statusCode === 403 || error?.message?.includes('permission')) {
        errorTitle = "Accès refusé";
        errorMessage = "Vous n'avez pas la permission d'envoyer cette image. Vérifiez votre compte.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    
    onImagesChange(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          <span>{images.length}/{maxImages} photos</span>
        </div>
        {images.length > 0 && (
          <span className="text-xs text-muted-foreground">Glissez pour réorganiser</span>
        )}
      </div>

      {/* Zone de sélection principale */}
      {images.length === 0 ? (
        <label className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors min-h-[200px]">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading || cameraLoading || moderating}
          />
          {uploading || cameraLoading ? (
            <div className="text-center">
              <Upload className="h-12 w-12 text-muted-foreground mb-3 mx-auto animate-pulse" />
              <span className="text-base text-muted-foreground font-medium">Envoi en cours...</span>
            </div>
          ) : moderating ? (
            <div className="text-center">
              <ShieldAlert className="h-12 w-12 text-primary mb-3 mx-auto animate-pulse" />
              <span className="text-base text-muted-foreground font-medium">Vérification en cours...</span>
              <span className="text-xs text-muted-foreground block mt-1">Analyse automatique du contenu</span>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="h-12 w-12 text-primary mb-3 mx-auto" />
              <span className="text-base font-medium mb-1">Sélectionnez vos photos</span>
              <span className="text-sm text-muted-foreground">Choisissez jusqu'à {maxImages} photos</span>
            </div>
          )}
        </label>
      ) : (
        <div className="space-y-3">
          {/* Grid des images uploadées */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {images.map((image, index) => (
              <div 
                key={index} 
                className="relative group aspect-square cursor-move"
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <img
                  src={image}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border-2 border-border"
                />
                <div className="absolute top-1 left-1 bg-background/80 text-xs px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {/* Bouton d'ajout si pas encore au maximum */}
            {images.length < maxImages && (
              <label className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={uploading || cameraLoading || moderating}
                />
                {uploading || cameraLoading ? (
                  <div className="text-center">
                    <Upload className="h-6 w-6 text-muted-foreground mb-1 mx-auto animate-pulse" />
                    <span className="text-xs text-muted-foreground">Envoi...</span>
                  </div>
                ) : moderating ? (
                  <div className="text-center">
                    <ShieldAlert className="h-6 w-6 text-primary mb-1 mx-auto animate-pulse" />
                    <span className="text-xs text-muted-foreground">Vérif...</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-6 w-6 text-muted-foreground mb-1 mx-auto" />
                    <span className="text-xs text-muted-foreground">Ajouter</span>
                  </div>
                )}
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
