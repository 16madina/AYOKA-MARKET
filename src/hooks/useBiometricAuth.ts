import { useState, useEffect } from 'react';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    checkAvailability();
    loadBiometricPreference();
  }, []);

  const checkAvailability = async () => {
    if (!Capacitor.isNativePlatform()) {
      setIsAvailable(false);
      return;
    }

    try {
      const result = await NativeBiometric.isAvailable();
      setIsAvailable(result.isAvailable);
      setBiometryType(result.biometryType);
    } catch (error) {
      console.error('Erreur vérification biométrie:', error);
      setIsAvailable(false);
    }
  };

  const loadBiometricPreference = () => {
    const enabled = localStorage.getItem('biometric_auth_enabled') === 'true';
    setIsEnabled(enabled);
  };

  const authenticate = async (): Promise<boolean> => {
    if (!isAvailable) {
      toast.error('L\'authentification biométrique n\'est pas disponible');
      return false;
    }

    try {
      await NativeBiometric.verifyIdentity({
        reason: 'Authentifiez-vous pour accéder à DJASSA',
        title: 'Authentification',
        subtitle: 'Utilisez votre biométrie',
        description: 'Touchez le capteur ou regardez l\'écran',
      });
      return true;
    } catch (error) {
      console.error('Erreur authentification:', error);
      toast.error('Authentification échouée');
      return false;
    }
  };

  const enableBiometric = async (): Promise<boolean> => {
    const success = await authenticate();
    if (success) {
      localStorage.setItem('biometric_auth_enabled', 'true');
      setIsEnabled(true);
      toast.success('Authentification biométrique activée');
      return true;
    }
    return false;
  };

  const disableBiometric = () => {
    localStorage.setItem('biometric_auth_enabled', 'false');
    setIsEnabled(false);
    toast.success('Authentification biométrique désactivée');
  };

  const getBiometryName = (): string => {
    if (!biometryType) return 'Biométrie';
    
    switch (biometryType) {
      case BiometryType.FACE_ID:
        return 'Face ID';
      case BiometryType.TOUCH_ID:
        return 'Touch ID';
      case BiometryType.FINGERPRINT:
        return 'Empreinte digitale';
      case BiometryType.FACE_AUTHENTICATION:
        return 'Reconnaissance faciale';
      case BiometryType.IRIS_AUTHENTICATION:
        return 'Reconnaissance iris';
      default:
        return 'Biométrie';
    }
  };

  return {
    isAvailable,
    isEnabled,
    biometryType,
    authenticate,
    enableBiometric,
    disableBiometric,
    getBiometryName,
  };
};
