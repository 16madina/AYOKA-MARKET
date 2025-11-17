import { useState } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
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

export const ImageUploader = ({ images, onImagesChange, maxImages = 10 }: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
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
      toast({
        title: "Erreur",
        description: "Impossible d'accéder à la galerie",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    performanceMonitor.startMeasure('image-upload', { fileCount: files.length });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

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

            return publicUrl;
          } catch (error) {
            errorTracker.logError('upload', `Failed to upload ${file.name}`, error as Error);
            throw error;
          }
        });

        const chunkResults = await Promise.all(uploadPromises);
        newImages.push(...chunkResults);
      }

      onImagesChange([...images, ...newImages]);

      toast({
        title: "Images téléchargées",
        description: `${newImages.length} image(s) ajoutée(s) avec succès`,
      });

      performanceMonitor.endMeasure('image-upload');
    } catch (error) {
      console.error("Upload error:", error);
      errorTracker.logError('upload', 'Batch upload failed', error as Error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger les images",
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
            disabled={uploading || cameraLoading}
          />
          {uploading || cameraLoading ? (
            <div className="text-center">
              <Upload className="h-12 w-12 text-muted-foreground mb-3 mx-auto animate-pulse" />
              <span className="text-base text-muted-foreground font-medium">Envoi en cours...</span>
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
                  disabled={uploading || cameraLoading}
                />
                {uploading || cameraLoading ? (
                  <div className="text-center">
                    <Upload className="h-6 w-6 text-muted-foreground mb-1 mx-auto animate-pulse" />
                    <span className="text-xs text-muted-foreground">Envoi...</span>
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
