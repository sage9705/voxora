'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionErrorEvent = {
  error: string;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface UseVoiceRecognitionOptions {
  onTranscript: (transcript: string) => void;
  onError?: (errorMessage: string) => void;
}

export function useVoiceRecognition({
  onTranscript,
  onError,
}: UseVoiceRecognitionOptions) {
  const [listening, setListening] = useState(false);
  const recognition = useRef<SpeechRecognitionInstance | null>(null);

  // Stop recognition when unmounting
  useEffect(() => {
    return () => {
      recognition.current?.stop?.();
    };
  }, []);

  const toggleVoice = useCallback(() => {
    if (typeof window === 'undefined') return;

    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    const SpeechRecognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError?.(
        'Voice input is not supported by this browser. Try Chrome or Edge, or type your question.',
      );
      return;
    }

    if (listening) {
      recognition.current?.stop();
      setListening(false);
      return;
    }

    const instance = new SpeechRecognition();
    recognition.current = instance;
    instance.lang = 'en-US';
    instance.interimResults = true;
    instance.continuous = false;

    instance.onstart = () => setListening(true);

    instance.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onTranscript(transcript);
    };

    instance.onerror = (event) => {
      setListening(false);
      if (event.error === 'not-allowed') {
        onError?.(
          'Microphone permission was denied. Please allow microphone access in your browser settings to ask by voice.',
        );
      } else if (event.error === 'no-speech') {
        onError?.('No speech was detected. Please try speaking again.');
      } else {
        onError?.(
          'Could not hear clearly. Please try again or type your question.',
        );
      }
    };

    instance.onend = () => setListening(false);
    instance.start();
  }, [listening, onError, onTranscript]);

  const stopVoice = useCallback(() => {
    recognition.current?.stop();
    setListening(false);
  }, []);

  return {
    listening,
    toggleVoice,
    stopVoice,
  };
}
