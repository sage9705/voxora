'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioLines, CircleHelp } from 'lucide-react';
import type { AnswerSource, ChatMessage, DocumentRecord } from '@/lib/types';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { WelcomeGrid } from '@/components/WelcomeGrid';
import { ChatArea } from '@/components/ChatArea';
import { Composer } from '@/components/Composer';
import { Notice } from '@/components/Notice';

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
};

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

const starters = [
  {
    label: 'Compare versions',
    question: 'What changed between the two manual versions?',
  },
  {
    label: 'Find a specification',
    question: 'What is the maximum operating pressure for Model A?',
  },
  {
    label: 'Check an exception',
    question: 'When is Model B allowed to operate at 13 bar?',
  },
];

function id() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export default function Home() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [listening, setListening] = useState(false);
  const [dark, setDark] = useState(true);
  const [notice, setNotice] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const fileInput = useRef<HTMLInputElement>(null);
  const recognition = useRef<SpeechRecognitionInstance | null>(null);

  const chunks = useMemo(
    () => documents.flatMap((doc) => doc.chunks || []),
    [documents],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);

  useEffect(
    () => () => {
      recognition.current?.stop?.();
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    },
    [],
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
        if (file.size > 8 * 1024 * 1024) {
          setNotice(`${file.name} exceeds the 8 MB upload limit.`);
          continue;
        }
        if (
          documents.some(
            (doc) => doc.name === file.name && doc.size === file.size,
          )
        )
          continue;
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
          if (!returnedDocs.length) throw new Error('No document record returned.');

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

  async function loadSamples() {
    setUploading(true);
    setNotice('Loading the sample manuals…');
    const samples = [
      {
        name: 'NexGen NX-300 Manual v1.0.pdf',
        path: '/sample-documents/nexgen-nx300-manual-v1.pdf',
      },
      {
        name: 'NexGen NX-300 Manual v2.0.pdf',
        path: '/sample-documents/nexgen-nx300-manual-v2.pdf',
      },
    ];
    for (const sample of samples) {
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
  }

  function readAloud(text: string) {
    if (!('speechSynthesis' in window)) {
      setNotice('Speech playback is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  }

  async function ask(value = question, fromVoice = false) {
    const prompt = value.trim();
    if (!prompt || asking) return;
    if (!chunks.length) {
      setNotice(
        'Upload your PDF manual or load the sample documents before asking a question.',
      );
      return;
    }
    setQuestion('');
    setNotice('');
    const userMessage: ChatMessage = {
      id: id(),
      role: 'user',
      content: prompt,
      createdAt: Date.now(),
    };
    setMessages((current) => [...current, userMessage]);
    setAsking(true);

    const startTime = performance.now();
    try {
      // Include recent conversation turns for context-aware follow-ups
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: prompt, chunks, history }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Could not answer that question.');
      const result = data as ApiAnswer;
      const latencyMs =
        result.latencyMs ?? Math.round(performance.now() - startTime);

      let audioLatencyMs: number | undefined;
      if (fromVoice || autoSpeak) {
        readAloud(result.answer);
        audioLatencyMs = Math.round(performance.now() - startTime);
      }

      setMessages((current) => [
        ...current,
        {
          id: id(),
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
          id: id(),
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
  }

  function startVoice() {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setNotice(
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
      for (let i = event.resultIndex; i < event.results.length; i++)
        transcript += event.results[i][0].transcript;
      setQuestion(transcript);
    };
    instance.onerror = (event) => {
      setListening(false);
      if (event.error === 'not-allowed') {
        setNotice(
          'Microphone permission was denied. Please allow microphone access in your browser settings to ask by voice.',
        );
      } else if (event.error === 'no-speech') {
        setNotice('No speech was detected. Please try speaking again.');
      } else {
        setNotice(
          'Could not hear clearly. Please try again or type your question.',
        );
      }
    };
    instance.onend = () => setListening(false);
    instance.start();
  }

  function clearConversation() {
    setMessages([]);
    setNotice(
      'Conversation cleared. Your loaded documents are still available.',
    );
    window.speechSynthesis?.cancel();
  }

  return (
    <main className="app-shell">
      <Sidebar
        documents={documents}
        messages={messages}
        dark={dark}
        uploading={uploading}
        showHistory={showHistory}
        onToggleHistory={() => setShowHistory((v) => !v)}
        onClearConversation={clearConversation}
        onRemoveDocument={(id, name) => {
          setDocuments((current) => current.filter((item) => item.id !== id));
          setNotice(`${name} removed from this session.`);
        }}
        onOpenFileInput={() => fileInput.current?.click()}
        onToggleTheme={() => setDark((v) => !v)}
      />

      <section className="main-panel">
        <Topbar
          dark={dark}
          onToggleTheme={() => setDark((v) => !v)}
          onShowHelp={() =>
            setNotice(
              'Upload PDFs, then ask a question by typing or using the microphone. Enable GROQ_API_KEY for AI-synthesized answers; without it, Voxora uses local passage retrieval.',
            )
          }
        />

        <div className="workspace-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> YOUR KNOWLEDGE, IN CONVERSATION
              </div>
              <h1>
                Ask anything.
                <br />
                <span>Find it in your documents.</span>
              </h1>
              <p className="heading-description">
                Skip the searching. Ask a question in your own words and get
                answers grounded in the files you trust.
              </p>
            </div>
            <div className="heading-art" aria-hidden="true">
              <div className="art-orbit orbit-one" />
              <div className="art-orbit orbit-two" />
              <div className="art-center">
                <AudioLines size={34} />
              </div>
              <span className="art-dot dot-one" />
              <span className="art-dot dot-two" />
              <span className="art-dot dot-three" />
            </div>
          </div>

          {!documents.length ? (
            <WelcomeGrid
              uploading={uploading}
              onUploadFiles={uploadFiles}
              onLoadSamples={loadSamples}
              onOpenFileInput={() => fileInput.current?.click()}
            />
          ) : (
            <ChatArea
              documentsCount={documents.length}
              messages={messages}
              asking={asking}
              autoSpeak={autoSpeak}
              starters={starters}
              onToggleAutoSpeak={() => setAutoSpeak((v) => !v)}
              onToggleHistory={() => setShowHistory((v) => !v)}
              onClearConversation={clearConversation}
              onSelectStarter={(q) => void ask(q)}
              onReadAloud={readAloud}
            >
              <Composer
                question={question}
                setQuestion={setQuestion}
                asking={asking}
                listening={listening}
                starters={starters}
                onAsk={(q, fromVoice) => void ask(q, fromVoice)}
                onToggleVoice={startVoice}
              />
            </ChatArea>
          )}

          <Notice message={notice} onDismiss={() => setNotice('')} />

          <footer className="page-footer">
            <span>
              VOXORA <span className="footer-dot">●</span> DOCUMENT INTELLIGENCE
            </span>
            <span>Read less. Understand more.</span>
            <button
              onClick={() =>
                setNotice(
                  'Voxora reads text-based PDF files, retrieves relevant passages and returns source references. Add a Groq API key for AI-synthesized answers.',
                )
              }
            >
              <CircleHelp size={13} /> How it works
            </button>
          </footer>
        </div>
      </section>

      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files) void uploadFiles(event.target.files);
          event.currentTarget.value = '';
        }}
      />
    </main>
  );
}
