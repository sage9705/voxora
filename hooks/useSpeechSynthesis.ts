'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Strip markdown formatting so the browser speech engine reads
 * clean, natural prose instead of literal characters like "asterisk".
 */
function stripMarkdown(md: string): string {
  return (
    md
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*{3}(.+?)\*{3}/g, '$1')
      .replace(/_{3}(.+?)_{3}/g, '$1')
      .replace(/\*{2}(.+?)\*{2}/g, '$1')
      .replace(/_{2}(.+?)_{2}/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/~~(.+?)~~/g, '$1')
      .replace(/^\s*>\s?/gm, '')
      .replace(/^[-*_]{3,}\s*$/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

function selectBestVoice(availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!availableVoices.length) return null;

  const englishVoices = availableVoices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const pool = englishVoices.length > 0 ? englishVoices : availableVoices;

  const priorityPatterns = [
    /natural.*online/i,
    /online.*natural/i,
    /natural/i,
    /neural/i,
    /google\s+us\s+english/i,
    /google\s+uk\s+english/i,
    /google/i,
    /samantha/i,
    /karen/i,
    /daniel/i,
    /serena/i,
    /aria/i,
    /jenny/i,
    /guy/i,
  ];

  for (const pattern of priorityPatterns) {
    const match = pool.find((v) => pattern.test(v.name));
    if (match) return match;
  }

  return pool.find((v) => v.default) || pool[0] || null;
}

interface UseSpeechSynthesisOptions {
  onError?: (message: string) => void;
}

export function useSpeechSynthesis(options?: UseSpeechSynthesisOptions) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback(
    (text: string, rate = 1.0) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        options?.onError?.('Speech playback is not supported in this browser.');
        return;
      }
      window.speechSynthesis.cancel();
      const cleanText = stripMarkdown(text);
      const utterance = new SpeechSynthesisUtterance(cleanText);

      const availableVoices =
        voices.length > 0 ? voices : window.speechSynthesis.getVoices();
      const bestVoice = selectBestVoice(availableVoices);

      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang;
      }

      utterance.rate = rate;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    },
    [options, voices],
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
