'use client';

import {
  AudioLines,
  BookOpen,
  ChevronDown,
  FileText,
  FileUp,
  History,
  Moon,
  Plus,
  LockKeyhole,
  Sun,
  X,
} from 'lucide-react';
import type { ChatMessage, DocumentRecord } from '@/lib/types';

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type SidebarProps = {
  documents: DocumentRecord[];
  messages: ChatMessage[];
  dark: boolean;
  uploading: boolean;
  showHistory: boolean;
  onToggleHistory: () => void;
  onClearConversation: () => void;
  onRemoveDocument: (docId: string, docName: string) => void;
  onOpenFileInput: () => void;
  onToggleTheme: () => void;
};

export function Sidebar({
  documents,
  messages,
  dark,
  uploading,
  showHistory,
  onToggleHistory,
  onClearConversation,
  onRemoveDocument,
  onOpenFileInput,
  onToggleTheme,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div className="brand-mark">
          <AudioLines size={22} strokeWidth={2.2} />
        </div>
        <div>
          <div className="brand-name">
            voxora<span>.</span>
          </div>
          <div className="brand-caption">DOCUMENT INTELLIGENCE</div>
        </div>
      </div>
      <button className="new-chat" onClick={onClearConversation}>
        <Plus size={17} /> New conversation <span>⌘ K</span>
      </button>
      <div className="side-label">WORKSPACE</div>
      <button className="side-link active">
        <BookOpen size={17} /> Document chat
      </button>
      <button className="side-link" onClick={onToggleHistory}>
        <History size={17} /> Conversation history{' '}
        <ChevronDown
          size={14}
          className={showHistory ? 'rotated' : 'side-end'}
        />
      </button>
      {showHistory && (
        <div className="history-panel">
          {messages.length ? (
            <button onClick={onToggleHistory}>
              <span className="history-dot" /> Current conversation{' '}
              <small>
                {messages.filter((m) => m.role === 'user').length} questions
              </small>
            </button>
          ) : (
            <p>Your recent conversations will appear here.</p>
          )}
        </div>
      )}
      <div className="side-label docs-label">
        YOUR LIBRARY <span>{documents.length.toString().padStart(2, '0')}</span>
      </div>
      <div className="document-list">
        {documents.map((doc) => (
          <div className="document-item" key={doc.id}>
            <div className="pdf-icon">
              <FileText size={17} />
            </div>
            <div className="doc-meta">
              <div className="doc-name" title={doc.name}>
                {doc.name}
              </div>
              <div className="doc-sub">
                {doc.pages} {doc.pages === 1 ? 'page' : 'pages'} <span>·</span>{' '}
                {formatSize(doc.size)}
                {doc.ingestTimeMs !== undefined && (
                  <>
                    <span>·</span> {doc.ingestTimeMs}ms ingest
                  </>
                )}
              </div>
            </div>
            <button
              className="icon-button remove-doc"
              title="Remove document"
              onClick={() => onRemoveDocument(doc.id, doc.name)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {!documents.length && (
          <div className="empty-library">
            <div className="empty-library-icon">
              <FileUp size={20} />
            </div>
            <p>Your documents live here</p>
            <span>Add a PDF to start asking questions.</span>
          </div>
        )}
      </div>
      <button
        className="add-doc-button"
        onClick={onOpenFileInput}
        disabled={uploading}
      >
        <Plus size={16} /> Add documents
      </button>
      <div className="sidebar-spacer" />
      <div className="privacy-card">
        <div className="privacy-icon">
          <LockKeyhole size={16} />
        </div>
        <div>
          <strong>Private by design</strong>
          <p>
            Files are processed for this session and not saved to a database.
          </p>
        </div>
      </div>
      <div className="profile-row">
        <div className="profile-avatar">V</div>
        <div className="profile-copy">
          <strong>Personal workspace</strong>
          <span>Local session</span>
        </div>
        <button
          className="icon-button"
          onClick={onToggleTheme}
          title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </aside>
  );
}
