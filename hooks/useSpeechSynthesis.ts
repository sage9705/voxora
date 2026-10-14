'use client';

import { useCallback, useEffect } from 'react';

interface UseSpeechSynthesisOptions {
  onError?: (message: string) => void;
}

export function useSpeechSynthesis(options?: UseSpeechSynthesisOptions) {
  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback(
    (text: string, rate = 1.05) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        options?.onError?.('Speech playback is not supported in this browser.');
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    },
    [options],
  );

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    cancel,
  };
}
