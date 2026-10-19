'use client';

import { useCallback, useMemo, useState } from 'react';
import type { AnswerSource, ChatMessage, DocumentRecord } from '@/lib/types';
import { SAMPLE_DOCUMENTS } from '@/lib/constants';
import { rankChunks } from '@/lib/retrieval';

type ApiAnswer = {
  answer: string;
  sources: AnswerSource[];
  mode: 'ai' | 'local';
  latencyMs?: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    estimatedCostUsd?: number;
  };
  warning?: string;
};

function generateId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export function useDocumentChat() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [notice, setNotice] = useState('');

  const chunks = useMemo(
    () => documents.flatMap((doc) => doc.chunks || []),
    [documents],
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const pdfs = Array.from(files).filter(
        (file) =>
          file.type === 'application/pdf' ||
          file.name.toLowerCase().endsWith('.pdf'),
      );
      if (!pdfs.length) {
        setNotice('Please choose a valid text-based PDF file.');
        return;
      }

      setUploading(true);
      setNotice('');

      for (const file of pdfs) {
        if (file.size > 50 * 1024 * 1024) {
          setNotice(`${file.name} exceeds the 50 MB upload limit.`);
          continue;
        }
        if (
          documents.some(
            (doc) => doc.name === file.name && doc.size === file.size,
          )
        ) {
          continue;
        }

        try {
          const form = new FormData();
          form.append('file', file);
          const response = await fetch('/api/ingest', {
            method: 'POST',
            body: form,
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Upload failed');

          const returnedDocs: DocumentRecord[] = data.documents?.length
            ? (data.documents as DocumentRecord[])
            : data.document
              ? [data.document as DocumentRecord]
              : [];

          if (!returnedDocs.length) {
            throw new Error('No document record returned.');
          }

          setDocuments((current) => [...current, ...returnedDocs]);
          const totalPages = returnedDocs.reduce((acc, d) => acc + d.pages, 0);
          const totalChunks = returnedDocs.reduce(
            (acc, d) => acc + (d.chunks?.length || 0),
            0,
          );
          const time =
            data.totalIngestTimeMs ?? returnedDocs[0]?.ingestTimeMs ?? 0;

          setNotice(
            `${file.name} ingested successfully (${totalPages} ${totalPages === 1 ? 'page' : 'pages'}, ${totalChunks} passages in ${time}ms).`,
          );
        } catch (error) {
          setNotice(
            error instanceof Error ? error.message : 'Could not read this PDF.',
          );
        }
      }
      setUploading(false);
    },
    [documents],
  );

  const loadSamples = useCallback(async () => {
    setUploading(true);
    setNotice('Loading the sample manuals…');

    for (const sample of SAMPLE_DOCUMENTS) {
      if (documents.some((doc) => doc.name === sample.name)) continue;
      try {
        const response = await fetch(sample.path);
        const blob = await response.blob();
        const file = new File([blob], sample.name, { type: 'application/pdf' });
        const form = new FormData();
        form.append('file', file);
        const result = await fetch('/api/ingest', {
          method: 'POST',
          body: form,
        });
        const data = await result.json();
        if (!result.ok) throw new Error(data.error || 'Could not load sample');
        const newDoc = (data.document || data.documents?.[0]) as DocumentRecord;
        if (newDoc) {
          setDocuments((current) => [...current, newDoc]);
        }
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : 'Unable to load sample documents.',
        );
      }
    }
    setUploading(false);
    setNotice(
      'Sample manuals are ready. Try asking what changed between versions or compare Model A and B.',
    );
  }, [documents]);

  const removeDocument = useCallback((id: string, name: string) => {
    setDocuments((current) => current.filter((item) => item.id !== id));
    setNotice(`${name} removed from this session.`);
  }, []);

  const clearAllDocuments = useCallback(() => {
    setDocuments([]);
    setNotice('All documents removed from this session.');
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setNotice(
      'Conversation cleared. Your loaded documents are still available.',
    );
  }, []);

  const askQuestion = useCallback(
    async ({
      prompt,
      fromVoice = false,
      autoSpeak = true,
      onSpeak,
    }: {
      prompt: string;
      fromVoice?: boolean;
      autoSpeak?: boolean;
      onSpeak?: (text: string) => void;
    }) => {
      const trimmed = prompt.trim();
      if (!trimmed || asking) return;
      if (!chunks.length) {
        setNotice(
          'Upload your PDF manual or load the sample documents before asking a question.',
        );
        return;
      }

      setNotice('');
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: trimmed,
        createdAt: Date.now(),
      };
      setMessages((current) => [...current, userMessage]);
      setAsking(true);

      const startTime = performance.now();
      try {
        const history = messages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Context-aware retrieval query if this is a follow-up turn
        const lastUserTurn = history
          .filter((h) => h.role === 'user')
          .slice(-1)[0]?.content;
        const retrievalQuery =
          lastUserTurn && trimmed.length < 50
            ? `${lastUserTurn} ${trimmed}`
            : trimmed;

        // Candidate pre-filtering: If there are many chunks across documents,
        // pre-rank the top 30 most relevant candidates so network payload remains
        // under 25KB rather than sending megabytes of text across the wire.
        const candidateMatches =
          chunks.length > 30 ? rankChunks(retrievalQuery, chunks, 30) : [];
        const payloadChunks =
          chunks.length <= 30
            ? chunks
            : candidateMatches.length > 0
              ? candidateMatches
              : chunks.slice(0, 30);

        const response = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: trimmed,
            chunks: payloadChunks,
            history,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Could not answer that question.');
        }

        const result = data as ApiAnswer;
        if (result.warning) {
          setNotice(result.warning);
        }
        const latencyMs =
          result.latencyMs ?? Math.round(performance.now() - startTime);

        let audioLatencyMs: number | undefined;
        if (fromVoice || autoSpeak) {
          onSpeak?.(result.answer);
          audioLatencyMs = Math.round(performance.now() - startTime);
        }

        setMessages((current) => [
          ...current,
          {
            id: generateId(),
            role: 'assistant',
            content: result.answer,
            sources: result.sources,
            createdAt: Date.now(),
            mode: result.mode,
            latencyMs,
            audioLatencyMs,
            usage: result.usage,
          },
        ]);
      } catch (error) {
        setMessages((current) => [
          ...current,
          {
            id: generateId(),
            role: 'assistant',
            content:
              error instanceof Error
                ? error.message
                : 'An error occurred. Please try again.',
            createdAt: Date.now(),
            sources: [],
          },
        ]);
      } finally {
        setAsking(false);
      }
    },
    [asking, chunks, messages],
  );

  return {
    documents,
    messages,
    uploading,
    asking,
    notice,
    setNotice,
    chunks,
    uploadFiles,
    loadSamples,
    removeDocument,
    clearAllDocuments,
    clearConversation,
    askQuestion,
  };
}
