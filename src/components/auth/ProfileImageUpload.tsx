import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCamera } from "@/hooks/useCamera";
import { errorTracker } from "@/utils/errorTracking";

interface ProfileImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export const ProfileImageUpload = ({ value, onChange, disabled }: ProfileImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { pickFromGallery, isLoading: cameraLoading } = useCamera();

  const handleCameraSelect = async () => {
    try {
      const file = await pickFromGallery();
      if (!file) return;

      await uploadImage(file);
    } catch (error: any) {
      errorTracker.logError('camera', 'Failed to select image', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder à la galerie",
        variant: "destructive",
      });
    }
  };

  const uploadImage = async (file: File) => {
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `temp/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      onChange(publicUrl);

      toast({
        title: "Photo téléchargée",
        description: "Votre photo de profil a été ajoutée",
      });
    } catch (error) {
      console.error("Upload error:", error);
      errorTracker.logError('upload', 'Failed to upload avatar', error as Error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la photo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erreur",
        description: "Le fichier doit être une image",
        variant: "destructive",
      });
      return;
    }

    await uploadImage(file);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={value || ""} className="object-cover" />
          <AvatarFallback className="bg-muted text-2xl">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <label
          className={`absolute bottom-0 right-0 ${
            disabled || uploading || cameraLoading ? "cursor-not-allowed" : "cursor-pointer"
          }`}
          onClick={(e) => {
            e.preventDefault();
            if (!disabled && !uploading && !cameraLoading) {
              handleCameraSelect();
            }
          }}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={disabled || uploading || cameraLoading}
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full"
            disabled={disabled || uploading || cameraLoading}
            asChild
          >
            <div>
              {uploading || cameraLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </div>
          </Button>
        </label>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Cliquez sur l'icône pour ajouter une photo
      </p>
    </div>
  );
};
