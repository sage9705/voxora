'use client';

import { useCallback, useEffect } from 'react';

/**
 * Strip markdown formatting so the browser speech engine reads
 * clean, natural prose instead of literal characters like "asterisk".
 */
function stripMarkdown(md: string): string {
  return (
    md
      // Remove fenced code blocks (``` … ```)
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code (`…`)
      .replace(/`([^`]*)`/g, '$1')
      // Remove images ![alt](url)
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Remove links [text](url) → keep text
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Remove headings (### … )
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold+italic (***text*** or ___text___)
      .replace(/\*{3}(.+?)\*{3}/g, '$1')
      .replace(/_{3}(.+?)_{3}/g, '$1')
      // Remove bold (**text** or __text__)
      .replace(/\*{2}(.+?)\*{2}/g, '$1')
      .replace(/_{2}(.+?)_{2}/g, '$1')
      // Remove italic (*text* or _text_)
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      // Remove strikethrough (~~text~~)
      .replace(/~~(.+?)~~/g, '$1')
      // Remove blockquotes (> …)
      .replace(/^\s*>\s?/gm, '')
      // Remove horizontal rules (---, ***, ___)
      .replace(/^[-*_]{3,}\s*$/gm, '')
      // Remove unordered list markers (- , * , + )
      .replace(/^\s*[-*+]\s+/gm, '')
      // Remove ordered list markers (1. , 2. , etc.)
      .replace(/^\s*\d+\.\s+/gm, '')
      // Collapse multiple blank lines to a single pause
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

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
      const cleanText = stripMarkdown(text);
      const utterance = new SpeechSynthesisUtterance(cleanText);
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
