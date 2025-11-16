export interface DeviceInfo {
  isSamsungFold: boolean;
  isIPad: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  androidVersion: number | null;
  iosVersion: number | null;
  supportsWebP: boolean;
  screenWidth: number;
  screenHeight: number;
  isDualScreen: boolean;
}

export const detectDevice = (): DeviceInfo => {
  const ua = navigator.userAgent;
  
  // Détection Samsung Fold
  const isSamsungFold = /SM-F(9|7)\d{2}/.test(ua) || 
                        (window.screen.width >= 884 && /Samsung/.test(ua));
  
  // Détection iPad
  const isIPad = /iPad/.test(ua) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Détection iOS
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const iosMatch = ua.match(/OS (\d+)_/);
  const iosVersion = iosMatch ? parseInt(iosMatch[1]) : null;
  
  // Détection Android
  const isAndroid = /Android/.test(ua);
  const androidMatch = ua.match(/Android (\d+)/);
  const androidVersion = androidMatch ? parseInt(androidMatch[1]) : null;
  
  // Support WebP
  const canvas = document.createElement('canvas');
  const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  
  // Détection double écran (Samsung Fold)
  const isDualScreen = window.screen.width >= 884 && isSamsungFold;
  
  return {
    isSamsungFold,
    isIPad,
    isIOS,
    isAndroid,
    androidVersion,
    iosVersion,
    supportsWebP,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    isDualScreen,
  };
};

export const setupFoldDetection = (callback: (isDualScreen: boolean) => void) => {
  const mediaQuery = window.matchMedia('screen and (min-width: 884px)');
  
  const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
    callback(e.matches);
  };
  
  mediaQuery.addEventListener('change', handleChange);
  
  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
};

export const getOptimalImageFormat = (deviceInfo: DeviceInfo): 'webp' | 'jpeg' => {
  return deviceInfo.supportsWebP ? 'webp' : 'jpeg';
};

export const getDeviceCapabilities = (deviceInfo: DeviceInfo) => {
  return {
    canUseNativeCamera: deviceInfo.isIOS || deviceInfo.isAndroid,
    shouldUseReducedQuality: deviceInfo.isAndroid && (deviceInfo.androidVersion || 0) < 10,
    maxImageDimension: deviceInfo.isIPad ? 2048 : 1920,
    recommendedCompression: deviceInfo.isAndroid ? 0.8 : 0.85,
  };
};
