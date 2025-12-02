/**
 * Hook for managing splash screen preferences
 * Tracks whether user has seen the full splash screen animation
 * Uses localStorage for persistent cross-session tracking
 */

const SPLASH_SEEN_KEY = 'ayoka_splash_seen';

export const useSplashPreference = () => {
  const hasSeenFullSplash = localStorage.getItem(SPLASH_SEEN_KEY) === 'true';
  
  const markFullSplashSeen = () => {
    localStorage.setItem(SPLASH_SEEN_KEY, 'true');
  };
  
  return {
    isReturningUser: hasSeenFullSplash,
    markFullSplashSeen,
  };
};
