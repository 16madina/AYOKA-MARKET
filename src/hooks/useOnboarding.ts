import { useState, useEffect } from 'react';

interface OnboardingState {
  welcomeCompleted: boolean;
  firstPublishCompleted: boolean;
}

const ONBOARDING_KEY = 'djassa_onboarding';

export const useOnboarding = () => {
  const [state, setState] = useState<OnboardingState>(() => {
    const stored = localStorage.getItem(ONBOARDING_KEY);
    return stored ? JSON.parse(stored) : {
      welcomeCompleted: false,
      firstPublishCompleted: false,
    };
  });

  useEffect(() => {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  }, [state]);

  const completeWelcome = () => {
    setState(prev => ({ ...prev, welcomeCompleted: true }));
  };

  const completeFirstPublish = () => {
    setState(prev => ({ ...prev, firstPublishCompleted: true }));
  };

  const resetOnboarding = () => {
    setState({
      welcomeCompleted: false,
      firstPublishCompleted: false,
    });
  };

  return {
    ...state,
    completeWelcome,
    completeFirstPublish,
    resetOnboarding,
  };
};
