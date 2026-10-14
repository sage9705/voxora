'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: ArrayLike<
    ArrayLike<{ transcript: string }> & { isFinal: boolean }
  >;
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
  abort(): void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

/** Milliseconds of silence after last speech before auto-stopping. */
const SILENCE_TIMEOUT_MS = 2000;

interface UseVoiceRecognitionOptions {
  onTranscript: (transcript: string) => void;
  onFinalTranscript?: (transcript: string) => void;
  onError?: (errorMessage: string) => void;
}

export function useVoiceRecognition({
  onTranscript,
  onFinalTranscript,
  onError,
}: UseVoiceRecognitionOptions) {
  const [listening, setListening] = useState(false);
  const recognition = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscript = useRef('');
  const stoppedByUser = useRef(false);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      recognition.current?.abort?.();
    };
  }, [clearSilenceTimer]);

  const stopAndSubmit = useCallback(() => {
    clearSilenceTimer();
    stoppedByUser.current = true;
    recognition.current?.stop();
    // The onend handler will fire and set listening to false.
    // Deliver the accumulated final transcript.
    const text = finalTranscript.current.trim();
    if (text) {
      onFinalTranscript?.(text);
    }
  }, [clearSilenceTimer, onFinalTranscript]);

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

    // If already listening, stop and deliver what we have
    if (listening) {
      stopAndSubmit();
      return;
    }

    // Reset state for a new session
    finalTranscript.current = '';
    stoppedByUser.current = false;

    const instance = new SpeechRecognition();
    recognition.current = instance;
    instance.lang = 'en-US';
    instance.interimResults = true;
    instance.continuous = true; // Keep listening until user stops

    instance.onstart = () => setListening(true);

    instance.onresult = (event) => {
      clearSilenceTimer();

      let interim = '';
      let accumulated = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          accumulated += text;
        } else {
          interim += text;
        }
      }

      // Update the stored final transcript
      if (accumulated) {
        finalTranscript.current = accumulated;
      }

      // Show the full current transcript (final + interim) in the input
      onTranscript((accumulated + interim).trim());

      // Reset the silence timer: if no new results arrive within
      // SILENCE_TIMEOUT_MS, auto-stop and deliver the transcript
      silenceTimer.current = setTimeout(() => {
        stopAndSubmit();
      }, SILENCE_TIMEOUT_MS);
    };

    instance.onerror = (event) => {
      clearSilenceTimer();
      setListening(false);
      if (event.error === 'aborted') {
        // Intentional abort — no user-facing error
        return;
      }
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

    instance.onend = () => {
      clearSilenceTimer();
      setListening(false);

      // If the browser stopped recognition on its own (not user-initiated),
      // deliver whatever we have so far
      if (!stoppedByUser.current) {
        const text = finalTranscript.current.trim();
        if (text) {
          onFinalTranscript?.(text);
        }
      }
    };

    instance.start();
  }, [listening, onError, onTranscript, onFinalTranscript, stopAndSubmit, clearSilenceTimer]);

  const stopVoice = useCallback(() => {
    clearSilenceTimer();
    stoppedByUser.current = true;
    recognition.current?.stop();
    setListening(false);
  }, [clearSilenceTimer]);

  return {
    listening,
    toggleVoice,
    stopVoice,
  };
}
