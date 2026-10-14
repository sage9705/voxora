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

/**
 * Silence detection configuration.
 * After speech has been detected, if audio stays below the threshold
 * for SILENCE_DURATION_MS, the recording is auto-submitted.
 */
const SILENCE_THRESHOLD = 0.015; // RMS energy below this = silence
const SILENCE_DURATION_MS = 2500; // 2.5 seconds of silence → auto-submit
const ANALYSIS_INTERVAL_MS = 100; // Sample audio level every 100ms

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
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const finalTranscriptRef = useRef('');
  const isStoppingRef = useRef(false);
  const hasSpeechRef = useRef(false); // True once user has spoken above threshold
  const silenceStartRef = useRef<number | null>(null); // Timestamp when silence began

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopSilenceAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
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
      stopSilenceAnalysis();
      recognitionRef.current?.abort?.();
      releaseMediaStream();
    };
  }, [clearSilenceTimer, stopSilenceAnalysis, releaseMediaStream]);

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
    stopSilenceAnalysis();
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
    stopSilenceAnalysis,
    onFinalTranscript,
    onTranscript,
    releaseMediaStream,
    transcribeAudioBlob,
  ]);

  /**
   * Start monitoring audio levels from the microphone stream.
   * Uses Web Audio API AnalyserNode to compute RMS energy.
   * Once speech is detected (above threshold), begins tracking silence.
   * After SILENCE_DURATION_MS of continuous silence, auto-submits.
   */
  const startSilenceDetection = useCallback(
    (stream: MediaStream, stopFn: () => void) => {
      try {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Float32Array(analyser.fftSize);
        hasSpeechRef.current = false;
        silenceStartRef.current = null;

        analysisIntervalRef.current = setInterval(() => {
          if (!analyserRef.current) return;

          analyserRef.current.getFloatTimeDomainData(dataArray);

          // Compute RMS energy
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length);

          if (rms > SILENCE_THRESHOLD) {
            // User is speaking
            hasSpeechRef.current = true;
            silenceStartRef.current = null;
          } else if (hasSpeechRef.current) {
            // User was speaking but now it's quiet
            if (!silenceStartRef.current) {
              silenceStartRef.current = Date.now();
            } else if (Date.now() - silenceStartRef.current >= SILENCE_DURATION_MS) {
              // Sustained silence after speech → auto-submit
              stopFn();
            }
          }
        }, ANALYSIS_INTERVAL_MS);
      } catch (err) {
        console.warn('Audio level analysis not available:', err);
      }
    },
    [],
  );

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
    hasSpeechRef.current = false;
    silenceStartRef.current = null;
    clearSilenceTimer();
    stopSilenceAnalysis();

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

    // 2. Start audio-level silence detection (works in ALL browsers)
    startSilenceDetection(stream, () => {
      void stopAndSubmit();
    });

    // 3. Optionally start Web Speech API for real-time live interim feedback
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
    startSilenceDetection,
    stopAndSubmit,
    stopSilenceAnalysis,
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

