import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import imageCompression from 'browser-image-compression';

interface UseCameraOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export const useCamera = (options: UseCameraOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
  } = options;

  const isNative = Capacitor.isNativePlatform();

  const compressImage = async (file: File): Promise<File> => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: Math.max(maxWidth, maxHeight),
        useWebWorker: true,
        fileType: 'image/jpeg',
      };
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Error compressing image:', error);
      return file;
    }
  };

  const takePhoto = async (): Promise<File | null> => {
    setIsLoading(true);
    setError(null);

    try {
      if (isNative) {
        // Utiliser Capacitor Camera sur mobile natif
        const image = await Camera.getPhoto({
          quality: Math.round(quality * 100),
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        });

        if (!image.dataUrl) {
          throw new Error('No image data returned');
        }

        // Convertir dataUrl en File
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // Compresser l'image
        const compressed = await compressImage(file);
        return compressed;
      } else {
        // Utiliser input HTML sur web avec accès direct caméra
        return new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.capture = 'environment'; // Accès direct caméra arrière

          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
              reject(new Error('No file selected'));
              return;
            }

            try {
              const compressed = await compressImage(file);
              resolve(compressed);
            } catch (error) {
              reject(error);
            }
          };

          input.click();
        });
      }
    } catch (err: any) {
      console.error('Error taking photo:', err);
      setError(err.message || 'Failed to take photo');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const pickFromGallery = async (): Promise<File | null> => {
    setIsLoading(true);
    setError(null);

    try {
      if (isNative) {
        const image = await Camera.getPhoto({
          quality: Math.round(quality * 100),
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
        });

        if (!image.dataUrl) {
          throw new Error('No image data returned');
        }

        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        const compressed = await compressImage(file);
        return compressed;
      } else {
        return new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';

          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
              reject(new Error('No file selected'));
              return;
            }

            try {
              const compressed = await compressImage(file);
              resolve(compressed);
            } catch (error) {
              reject(error);
            }
          };

          input.click();
        });
      }
    } catch (err: any) {
      console.error('Error picking from gallery:', err);
      setError(err.message || 'Failed to pick image');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    takePhoto,
    pickFromGallery,
    isLoading,
    error,
    isNative,
  };
};
