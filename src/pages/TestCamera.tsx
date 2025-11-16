import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Image as ImageIcon, Info } from "lucide-react";
import { useCamera } from "@/hooks/useCamera";
import { detectDevice } from "@/utils/deviceDetection";
import { Badge } from "@/components/ui/badge";

export default function TestCamera() {
  const [images, setImages] = useState<string[]>([]);
  const [imageMetadata, setImageMetadata] = useState<any[]>([]);
  const { takePhoto, pickFromGallery, isLoading, error, isNative } = useCamera();
  const deviceInfo = detectDevice();

  const handleTakePhoto = async () => {
    const file = await takePhoto();
    if (file) {
      const url = URL.createObjectURL(file);
      setImages(prev => [...prev, url]);
      setImageMetadata(prev => [
        ...prev,
        {
          name: file.name,
          size: file.size,
          type: file.type,
          width: 0,
          height: 0,
        },
      ]);

      // Obtenir les dimensions
      const img = new Image();
      img.onload = () => {
        setImageMetadata(prev => {
          const newMeta = [...prev];
          newMeta[newMeta.length - 1].width = img.width;
          newMeta[newMeta.length - 1].height = img.height;
          return newMeta;
        });
      };
      img.src = url;
    }
  };

  const handlePickFromGallery = async () => {
    const file = await pickFromGallery();
    if (file) {
      const url = URL.createObjectURL(file);
      setImages(prev => [...prev, url]);
      setImageMetadata(prev => [
        ...prev,
        {
          name: file.name,
          size: file.size,
          type: file.type,
          width: 0,
          height: 0,
        },
      ]);

      const img = new Image();
      img.onload = () => {
        setImageMetadata(prev => {
          const newMeta = [...prev];
          newMeta[newMeta.length - 1].width = img.width;
          newMeta[newMeta.length - 1].height = img.height;
          return newMeta;
        });
      };
      img.src = url;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Test Caméra</h1>
          
          <div className="space-y-4">
            <div className="bg-accent/50 p-4 rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <Info className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <h3 className="font-semibold">Informations Appareil</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Mode:</span>
                  <Badge variant={isNative ? "default" : "secondary"} className="ml-2">
                    {isNative ? "Natif" : "Web"}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Plateforme:</span>
                  <span className="ml-2">{navigator.platform}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Écran:</span>
                  <span className="ml-2">{deviceInfo.screenWidth}x{deviceInfo.screenHeight}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">WebP:</span>
                  <Badge variant={deviceInfo.supportsWebP ? "default" : "secondary"} className="ml-2">
                    {deviceInfo.supportsWebP ? "Oui" : "Non"}
                  </Badge>
                </div>
                {deviceInfo.isSamsungFold && (
                  <div className="col-span-2">
                    <Badge variant="default">Samsung Fold Détecté</Badge>
                    {deviceInfo.isDualScreen && (
                      <Badge variant="secondary" className="ml-2">Double Écran</Badge>
                    )}
                  </div>
                )}
                {deviceInfo.isIPad && (
                  <div className="col-span-2">
                    <Badge variant="default">iPad Détecté</Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleTakePhoto}
                disabled={isLoading}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                {isLoading ? "Chargement..." : "Prendre Photo"}
              </Button>
              <Button
                onClick={handlePickFromGallery}
                disabled={isLoading}
                variant="secondary"
                className="flex-1"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                {isLoading ? "Chargement..." : "Galerie"}
              </Button>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        </Card>

        {images.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Photos Capturées ({images.length})</h2>
            <div className="space-y-4">
              {images.map((url, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <img src={url} alt={`Capture ${index + 1}`} className="w-full" />
                  <div className="p-3 bg-accent/30 text-sm grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Nom:</span>
                      <span className="ml-2">{imageMetadata[index]?.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Taille:</span>
                      <span className="ml-2">{(imageMetadata[index]?.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-2">{imageMetadata[index]?.type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dimensions:</span>
                      <span className="ml-2">
                        {imageMetadata[index]?.width}x{imageMetadata[index]?.height}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
