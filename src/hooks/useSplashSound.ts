/**
 * Hook for generating programmatic startup sound using Web Audio API
 * Creates an elegant "chime" sound without requiring external audio files
 */
export const useSplashSound = () => {
  const canPlaySound = () => {
    return typeof AudioContext !== 'undefined' || 
           typeof (window as any).webkitAudioContext !== 'undefined';
  };

  const playStartupSound = () => {
    if (!canPlaySound()) {
      console.log('Web Audio API not supported');
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // Create a pleasant "welcome" melody with multiple tones
      const playNote = (frequency: number, startTime: number, duration: number, volume: number = 0.15) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime);
        oscillator.type = 'sine';
        
        // Smooth attack and release
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);
        
        oscillator.start(audioContext.currentTime + startTime);
        oscillator.stop(audioContext.currentTime + startTime + duration);
      };
      
      // Pleasant ascending arpeggio (C-E-G major chord)
      playNote(523.25, 0, 0.3, 0.12);      // C5
      playNote(659.25, 0.12, 0.3, 0.12);   // E5
      playNote(783.99, 0.24, 0.4, 0.15);   // G5
      
    } catch (error) {
      console.error('Error playing startup sound:', error);
    }
  };

  return { playStartupSound, canPlaySound };
};
