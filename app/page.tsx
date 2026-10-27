'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Autorenew from '@mui/icons-material/Autorenew';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { WelcomeGrid } from '@/components/WelcomeGrid';
import { ChatArea } from '@/components/ChatArea';
import { Composer } from '@/components/Composer';
import { DocumentViewer } from '@/components/DocumentViewer';
import { Notice } from '@/components/Notice';
import { PageHeading } from '@/components/PageHeading';
import { Footer } from '@/components/Footer';
import { useDocumentChat } from '@/hooks/useDocumentChat';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { getDynamicStarters } from '@/lib/starters';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [dark, setDark] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  // Expanded Workspace State
  const [workspaceMode, setWorkspaceMode] = useState<
    'chat' | 'split' | 'reader'
  >('split');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeDocId, setActiveDocId] = useState<string | undefined>(undefined);
  const [viewerPage, setViewerPage] = useState<number | undefined>(undefined);
  const [highlightPassage, setHighlightPassage] = useState<string | undefined>(
    undefined,
  );

  const fileInput = useRef<HTMLInputElement>(null);

  const {
    documents,
    messages,
    uploading,
    asking,
    notice,
    setNotice,
    uploadFiles,
    removeDocument,
    clearAllDocuments,
    clearConversation,
    askQuestion,
    isHydrated,
  } = useDocumentChat();

  // Auto-select latest uploaded document
  useEffect(() => {
    if (documents.length > 0 && !activeDocId) {
      setActiveDocId(documents[0].id);
    }
  }, [documents, activeDocId]);

  const starters = useMemo(() => getDynamicStarters(documents), [documents]);

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

  // Handler when clicking document in sidebar
  const handleSelectDocument = useCallback((docId: string) => {
    setActiveDocId(docId);
    setViewerPage(1);
    setHighlightPassage(undefined);
    setWorkspaceMode((mode) => (mode === 'chat' ? 'split' : mode));
  }, []);

  // Handler when clicking citation [Page X] or source passage
  const handleViewSource = useCallback(
    (docId: string, page: number, excerpt?: string) => {
      if (docId) {
        setActiveDocId(docId);
      }
      setViewerPage(page);
      setHighlightPassage(excerpt);
      setWorkspaceMode((mode) => (mode === 'chat' ? 'split' : mode));
    },
    [],
  );

  // Handler for "Ask about page" from DocumentViewer
  const handleAskAboutPage = useCallback(
    (page: number, docName: string) => {
      const prompt = `What are the most important details and takeaways on page ${page} of ${docName}?`;
      setQuestion(prompt);
      if (workspaceMode === 'reader') {
        setWorkspaceMode('split');
      }
    },
    [workspaceMode],
  );

  const isWideLayout =
    documents.length > 0 &&
    (workspaceMode === 'split' || workspaceMode === 'reader');

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
        selectedDocumentId={activeDocId}
        onSelectDocument={handleSelectDocument}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />

      <section className="min-w-0 flex-1 flex flex-col transition-all">
        <Topbar
          dark={dark}
          onToggleTheme={() => setDark((v) => !v)}
          onShowHelp={() =>
            setNotice(
              'Upload PDFs, then ask questions by voice or typing. Use Split View to read document pages and citations alongside AI answers.',
            )
          }
          workspaceMode={workspaceMode}
          onChangeWorkspaceMode={setWorkspaceMode}
          documentsCount={documents.length}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
        />

        <div
          className={`mx-auto flex-1 flex flex-col transition-all duration-200 ${
            isWideLayout
              ? 'w-[calc(100%-32px)] max-w-[1920px] px-1 sm:px-2'
              : 'w-[min(1400px,calc(100%-72px))] max-[1200px]:w-[calc(100%-48px)] max-[760px]:w-[calc(100%-28px)]'
          }`}
        >
          {/* Show landing hero banner only when library is empty or in single-column chat mode */}
          {isHydrated && !documents.length && <PageHeading />}

          {!isHydrated ? (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <div className="flex items-center gap-2.5 text-muted text-sm font-medium">
                <Autorenew className="animate-spin text-accent" style={{ fontSize: 20 }} />
                <span>Restoring your workspace…</span>
              </div>
            </div>
          ) : !documents.length ? (
            <WelcomeGrid
              uploading={uploading}
              onUploadFiles={uploadFiles}
              onOpenFileInput={() => fileInput.current?.click()}
            />
          ) : (
            <>
              {/* Split Mode: Side-by-Side Chat & Document Viewer */}
              {workspaceMode === 'split' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 flex-1 items-stretch min-h-[620px] mt-4 mb-5">
                  <div className="flex flex-col min-w-0 h-full">
                    <ChatArea
                      documentsCount={documents.length}
                      documents={documents}
                      messages={messages}
                      asking={asking}
                      autoSpeak={autoSpeak}
                      starters={starters}
                      onToggleAutoSpeak={() => setAutoSpeak((v) => !v)}
                      onToggleHistory={() => setShowHistory((v) => !v)}
                      onClearConversation={handleClear}
                      onSelectStarter={(q) => handleAsk(q)}
                      onReadAloud={speak}
                      onViewSource={handleViewSource}
                      onToggleSplitView={() => setWorkspaceMode('chat')}
                      splitViewActive={true}
                    >
                      <Composer
                        question={question}
                        setQuestion={setQuestion}
                        asking={asking}
                        listening={listening}
                        starters={starters}
                        onAsk={(q, fromVoice) => handleAsk(q, fromVoice)}
                        onToggleVoice={toggleVoice}
                      />
                    </ChatArea>
                  </div>

                  <div className="flex flex-col min-w-0 h-full">
                    <DocumentViewer
                      documents={documents}
                      activeDocumentId={activeDocId}
                      activePage={viewerPage}
                      highlightText={highlightPassage}
                      onSelectDocument={(id) => setActiveDocId(id)}
                      onCloseViewer={() => setWorkspaceMode('chat')}
                      onAskAboutPage={handleAskAboutPage}
                      isExpanded={false}
                      onToggleExpand={() => setWorkspaceMode('reader')}
                    />
                  </div>
                </div>
              )}

              {/* Full Document Reader View */}
              {workspaceMode === 'reader' && (
                <div className="flex-1 flex flex-col min-h-[680px] mt-4 mb-5">
                  <DocumentViewer
                    documents={documents}
                    activeDocumentId={activeDocId}
                    activePage={viewerPage}
                    highlightText={highlightPassage}
                    onSelectDocument={(id) => setActiveDocId(id)}
                    onCloseViewer={() => setWorkspaceMode('chat')}
                    onAskAboutPage={handleAskAboutPage}
                    isExpanded={true}
                    onToggleExpand={() => setWorkspaceMode('split')}
                  />
                </div>
              )}

              {/* Standard Chat Only View */}
              {workspaceMode === 'chat' && (
                <div className="flex-1 flex flex-col mt-4">
                  <ChatArea
                    documentsCount={documents.length}
                    documents={documents}
                    messages={messages}
                    asking={asking}
                    autoSpeak={autoSpeak}
                    starters={starters}
                    onToggleAutoSpeak={() => setAutoSpeak((v) => !v)}
                    onToggleHistory={() => setShowHistory((v) => !v)}
                    onClearConversation={handleClear}
                    onSelectStarter={(q) => handleAsk(q)}
                    onReadAloud={speak}
                    onViewSource={handleViewSource}
                    onToggleSplitView={() => setWorkspaceMode('split')}
                    splitViewActive={false}
                  >
                    <Composer
                      question={question}
                      setQuestion={setQuestion}
                      asking={asking}
                      listening={listening}
                      starters={starters}
                      onAsk={(q, fromVoice) => handleAsk(q, fromVoice)}
                      onToggleVoice={toggleVoice}
                    />
                  </ChatArea>
                </div>
              )}
            </>
          )}

          <Notice message={notice} onDismiss={() => setNotice('')} />

          <Footer
            onShowHowItWorks={() =>
              setNotice(
                'Voxora reads PDF files, retrieves grounded passages, and features interactive page viewing and AI synthesis with Groq.',
              )
            }
          />
        </div>
      </section>

      <input
        ref={fileInput}
        type="file"
        accept=".pdf,.docx,.txt,.md,.markdown,.csv,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
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
