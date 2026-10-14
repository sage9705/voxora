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

/** Milliseconds of silence after speech has started before auto-submitting */
const SILENCE_TIMEOUT_MS = 3000;

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

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscriptRef = useRef('');
  const isStoppingRef = useRef(false);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const releaseMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      recognitionRef.current?.abort?.();
      releaseMediaStream();
    };
  }, [clearSilenceTimer, releaseMediaStream]);

  // Transcribe recorded audio blob using server-side Whisper (works in Brave, Safari, Firefox, Chrome)
  const transcribeAudioBlob = useCallback(
    async (blob: Blob): Promise<string> => {
      if (blob.size < 500) return '';
      try {
        const formData = new FormData();
        const extension = blob.type.includes('mp4') ? 'mp4' : 'webm';
        formData.append('audio', blob, `voice.${extension}`);

        const response = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.warn('Whisper fallback note:', errData.error);
          return '';
        }

        const data = await response.json();
        return (data.text || '').trim();
      } catch (err) {
        console.error('Audio transcription error:', err);
        return '';
      }
    },
    [],
  );

  const stopAndSubmit = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    clearSilenceTimer();
    setListening(false);

    // Stop Web Speech if active
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore if already stopped
    }

    // Stop MediaRecorder and grab audio blob
    const mediaRecorder = mediaRecorderRef.current;
    let audioBlob: Blob | null = null;

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => {
          if (audioChunksRef.current.length > 0) {
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          }
          resolve();
        };
        try {
          mediaRecorder.stop();
        } catch {
          resolve();
        }
      });
    }

    releaseMediaStream();

    // Check if we already received a transcript from Web Speech API
    let text = finalTranscriptRef.current.trim();

    // If Web Speech didn't produce text (typical in Brave / Safari), try Whisper transcription
    if (!text && audioBlob) {
      onTranscript('Transcribing speech…');
      text = await transcribeAudioBlob(audioBlob);
    }

    if (text) {
      onTranscript(text);
      onFinalTranscript?.(text);
    } else {
      onTranscript('');
    }

    isStoppingRef.current = false;
  }, [
    clearSilenceTimer,
    onFinalTranscript,
    onTranscript,
    releaseMediaStream,
    transcribeAudioBlob,
  ]);

  const toggleVoice = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // If currently listening, clicking again stops and submits immediately
    if (listening) {
      await stopAndSubmit();
      return;
    }

    // Reset state for a new session
    finalTranscriptRef.current = '';
    audioChunksRef.current = [];
    isStoppingRef.current = false;
    clearSilenceTimer();

    // 1. Request microphone access for audio recording (Universal across all browsers)
    let stream: MediaStream | null = null;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone not supported by your browser.');
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
    } catch (err) {
      console.error('Microphone access failed:', err);
      onError?.(
        'Microphone access was denied or unavailable. Please enable microphone permissions in your browser.',
      );
      return;
    }

    // Set up MediaRecorder
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : '';

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(250); // Slice audio every 250ms
      setListening(true);
    } catch (recorderError) {
      console.warn('MediaRecorder error:', recorderError);
    }

    // 2. Optionally start Web Speech API for real-time live interim feedback
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const instance = new SpeechRecognition();
        recognitionRef.current = instance;
        instance.lang = 'en-US';
        instance.interimResults = true;
        instance.continuous = true;

        instance.onstart = () => {
          setListening(true);
        };

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

          if (accumulated) {
            finalTranscriptRef.current = accumulated;
          }

          const currentText = (accumulated + interim).trim();
          if (currentText) {
            onTranscript(currentText);

            // Once user has spoken something, start silence timer to auto-submit after a comfortable pause
            silenceTimerRef.current = setTimeout(() => {
              void stopAndSubmit();
            }, SILENCE_TIMEOUT_MS);
          }
        };

        instance.onerror = (event) => {
          // Brave intentionally blocks Google speech server ('network' error)
          // or Safari aborts; do NOT kill recording because MediaRecorder will handle it!
          if (event.error === 'network' || event.error === 'no-speech' || event.error === 'aborted') {
            console.info('Client speech recognition event:', event.error);
            return;
          }
          if (event.error === 'not-allowed') {
            onError?.(
              'Microphone permission was not allowed for speech recognition.',
            );
          }
        };

        instance.onend = () => {
          // In Brave or on completion, if user didn't explicitly stop, we don't prematurely abort MediaRecorder
        };

        instance.start();
      } catch (e) {
        console.info('Web Speech API start skipped:', e);
      }
    }
  }, [
    clearSilenceTimer,
    listening,
    onError,
    onTranscript,
    stopAndSubmit,
  ]);

  const stopVoice = useCallback(() => {
    void stopAndSubmit();
  }, [stopAndSubmit]);

  return {
    listening,
    toggleVoice,
    stopVoice,
  };
}
