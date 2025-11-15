import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export const ProfileImageUpload = ({ value, onChange, disabled }: ProfileImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erreur",
        description: "Le fichier doit être une image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image ne doit pas dépasser 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${Math.random()}.${fileExt}`;
      const filePath = `temp/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("listings")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("listings")
        .getPublicUrl(filePath);

      onChange(publicUrl);

      toast({
        title: "Photo téléchargée",
        description: "Votre photo de profil a été ajoutée",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la photo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={value || ""} />
          <AvatarFallback className="bg-muted text-2xl">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <label
          className={`absolute bottom-0 right-0 ${
            disabled || uploading ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full"
            disabled={disabled || uploading}
            asChild
          >
            <div>
              {uploading ? (
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
        <br />
        (Max 2MB)
      </p>
    </div>
  );
};
