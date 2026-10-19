'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { WelcomeGrid } from '@/components/WelcomeGrid';
import { ChatArea } from '@/components/ChatArea';
import { Composer } from '@/components/Composer';
import { Notice } from '@/components/Notice';
import { PageHeading } from '@/components/PageHeading';
import { Footer } from '@/components/Footer';
import { useDocumentChat } from '@/hooks/useDocumentChat';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { STARTERS } from '@/lib/constants';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [dark, setDark] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const fileInput = useRef<HTMLInputElement>(null);

  const {
    documents,
    messages,
    uploading,
    asking,
    notice,
    setNotice,
    uploadFiles,
    loadSamples,
    removeDocument,
    clearAllDocuments,
    clearConversation,
    askQuestion,
  } = useDocumentChat();

  const handleAskRef = useRef<(text: string, fromVoice: boolean) => void>(
    () => {},
  );

  const { speak, cancel: cancelSpeech } = useSpeechSynthesis({
    onError: setNotice,
  });

  const handleAsk = useCallback(
    (promptText = question, fromVoice = false) => {
      const text = promptText.trim();
      if (!text) return;
      setQuestion('');
      void askQuestion({
        prompt: text,
        fromVoice,
        autoSpeak,
        onSpeak: speak,
      });
    },
    [askQuestion, autoSpeak, question, speak],
  );

  // Keep ref in sync so the voice callback never captures a stale closure
  useEffect(() => {
    handleAskRef.current = handleAsk;
  }, [handleAsk]);

  const { listening, toggleVoice } = useVoiceRecognition({
    onTranscript: setQuestion,
    onFinalTranscript: useCallback((text: string) => {
      handleAskRef.current(text, true);
    }, []),
    onError: setNotice,
  });

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);

  const handleClear = useCallback(() => {
    clearConversation();
    cancelSpeech();
  }, [clearConversation, cancelSpeech]);

  return (
    <main className="min-h-screen flex bg-bg max-[760px]:block">
      <Sidebar
        documents={documents}
        messages={messages}
        dark={dark}
        uploading={uploading}
        showHistory={showHistory}
        onToggleHistory={() => setShowHistory((v) => !v)}
        onClearConversation={handleClear}
        onRemoveDocument={removeDocument}
        onClearAllDocuments={clearAllDocuments}
        onOpenFileInput={() => fileInput.current?.click()}
        onToggleTheme={() => setDark((v) => !v)}
      />

      <section className="min-w-0 flex-1 flex flex-col">
        <Topbar
          dark={dark}
          onToggleTheme={() => setDark((v) => !v)}
          onShowHelp={() =>
            setNotice(
              'Upload PDFs, then ask a question by typing or using the microphone. Enable GROQ_API_KEY for AI-synthesized answers; without it, Voxora uses local passage retrieval.',
            )
          }
        />

        <div className="w-[min(1400px,calc(100%-72px))] mx-auto flex-1 flex flex-col max-[1200px]:w-[calc(100%-48px)] max-[760px]:w-[calc(100%-28px)]">
          <PageHeading />

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
              starters={STARTERS}
              onToggleAutoSpeak={() => setAutoSpeak((v) => !v)}
              onToggleHistory={() => setShowHistory((v) => !v)}
              onClearConversation={handleClear}
              onSelectStarter={(q) => handleAsk(q)}
              onReadAloud={speak}
            >
              <Composer
                question={question}
                setQuestion={setQuestion}
                asking={asking}
                listening={listening}
                starters={STARTERS}
                onAsk={(q, fromVoice) => handleAsk(q, fromVoice)}
                onToggleVoice={toggleVoice}
              />
            </ChatArea>
          )}

          <Notice message={notice} onDismiss={() => setNotice('')} />

          <Footer
            onShowHowItWorks={() =>
              setNotice(
                'Voxora reads text-based PDF files, retrieves relevant passages and returns source references. Add a Groq API key for AI-synthesized answers.',
              )
            }
          />
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
