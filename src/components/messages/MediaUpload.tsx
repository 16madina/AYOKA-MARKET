import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Image, Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCamera } from '@/hooks/useCamera';
import { errorTracker } from '@/utils/errorTracking';

interface MediaUploadProps {
  onUpload: (url: string) => void;
  userId: string;
}

export const MediaUpload = ({ onUpload, userId }: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { pickFromGallery, takePhoto, isLoading: cameraLoading, isNative } = useCamera();

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: 'La taille maximale est de 5 MB',
          variant: 'destructive',
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('listings')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('listings')
        .getPublicUrl(data.path);

      onUpload(publicUrl);
      
      toast({
        title: 'Image envoyée',
        description: 'Votre image a été téléchargée avec succès',
      });
    } catch (error) {
      console.error('Upload error:', error);
      errorTracker.logError('upload', 'Failed to upload media', error as Error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger l\'image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async () => {
    try {
      const file = await pickFromGallery();
      if (file) {
        await uploadImage(file);
      }
    } catch (error: any) {
      errorTracker.logError('camera', 'Failed to select media', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'accéder à la galerie',
        variant: 'destructive',
      });
    }
  };

  const handleCameraCapture = async () => {
    try {
      const file = await takePhoto();
      if (file) {
        await uploadImage(file);
      }
    } catch (error: any) {
      errorTracker.logError('camera', 'Failed to take photo', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'accéder à l\'appareil photo',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadImage(file);
  };

  const isDisabled = uploading || cameraLoading;

  return (
    <div className="flex items-center gap-1">
      <input
        type="file"
        accept="image/*"
        id="media-upload"
        className="hidden"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      {/* Camera button - take photo directly */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCameraCapture}
        disabled={isDisabled}
        type="button"
        aria-label="Prendre une photo"
      >
        {uploading || cameraLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Camera className="h-5 w-5" />
        )}
      </Button>
      {/* Gallery button - select from gallery */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleGalleryUpload}
        disabled={isDisabled}
        type="button"
        aria-label="Choisir une image"
      >
        <Image className="h-5 w-5" />
      </Button>
    </div>
  );
};
