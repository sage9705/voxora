'use client';

import {
  MdAdd,
  MdCircle,
  MdClose,
  MdDarkMode,
  MdForum,
  MdGraphicEq,
  MdKeyboardArrowDown,
  MdKeyboardCommandKey,
  MdLightMode,
  MdMenuBook,
  MdPictureAsPdf,
  MdSecurity,
  MdUploadFile,
} from 'react-icons/md';
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
    <aside className="w-[var(--sidebar)] flex-[0_0_var(--sidebar)] h-screen sticky top-0 flex flex-col border-r border-line bg-panel pt-[27px] px-4 pb-3.5 z-[5] max-[760px]:relative max-[760px]:w-full max-[760px]:h-auto max-[760px]:p-[14px_16px] max-[760px]:border-r-0 max-[760px]:border-b max-[760px]:grid max-[760px]:grid-cols-[1fr_auto] max-[760px]:gap-x-2.5">
      <div className="flex items-center gap-3 pb-[27px] px-[7px] max-[760px]:p-0 max-[760px]:col-start-1 max-[760px]:row-start-1">
        <div className="h-10 w-10 rounded-xl bg-accent text-accent-ink grid place-items-center shadow-[0_4px_18px_color-mix(in_srgb,var(--accent)_14%,transparent)] max-[760px]:h-9 max-[760px]:w-9">
          <MdGraphicEq size={24} />
        </div>
        <div>
          <div className="font-heading font-extrabold text-[23px] tracking-[-1.2px] leading-[1.1] max-[760px]:text-[20px]">
            voxora<span className="text-accent">.</span>
          </div>
          <div className="font-mono font-semibold text-[10.5px] tracking-[1.2px] text-muted mt-1 max-[760px]:text-[10px]">
            DOCUMENT INTELLIGENCE
          </div>
        </div>
      </div>
      <button
        className="h-11 flex items-center gap-[9px] px-3 border border-line-strong bg-panel-raised rounded-[9px] text-text text-[13.5px] font-semibold text-left transition-[border-color,background] duration-150 hover:border-muted-2 hover:bg-panel-soft max-[760px]:col-start-2 max-[760px]:row-start-1 max-[760px]:self-center max-[760px]:h-[38px] max-[760px]:text-[13px]"
        onClick={onClearConversation}
      >
        <MdAdd size={19} /> New conversation{' '}
        <span className="ml-auto font-mono text-[11px] text-muted-2 border border-line py-[3px] px-1.5 rounded max-[760px]:hidden inline-flex items-center gap-1">
          <MdKeyboardCommandKey size={11} /> K
        </span>
      </button>
      <div className="font-mono font-semibold text-[11px] tracking-[1.15px] text-muted-2 pt-7 px-2.5 pb-2.5 max-[760px]:hidden">
        WORKSPACE
      </div>
      <button className="h-10 flex items-center gap-2.5 px-2.5 text-text font-semibold border-0 bg-[color-mix(in_srgb,var(--accent)_10%,var(--panel))] rounded-[7px] text-left text-[13.5px] transition-[background,color] duration-150 max-[760px]:hidden">
        <MdMenuBook size={18} className="text-accent" /> Document chat
      </button>
      <button
        className="h-10 flex items-center gap-2.5 px-2.5 text-muted border-0 bg-transparent rounded-[7px] text-left text-[13.5px] transition-[background,color] duration-150 hover:text-text hover:bg-panel-raised max-[760px]:hidden group w-full"
        onClick={onToggleHistory}
      >
        <MdForum size={18} className="text-muted-2 group-hover:text-text" />{' '}
        Conversation history{' '}
        <MdKeyboardArrowDown
          size={18}
          className={`ml-auto transition-transform ${showHistory ? 'rotate-180' : ''}`}
        />
      </button>
      {showHistory && (
        <div className="mt-[5px] mr-0 mb-0 ml-[23px] pl-2.5 border-l border-line max-[760px]:hidden">
          {messages.length ? (
            <button
              className="bg-transparent border-0 text-text text-left grid grid-cols-[8px_1fr] gap-x-2 items-center py-2 text-[13px] w-full"
              onClick={onToggleHistory}
            >
              <MdCircle size={7} className="text-accent" /> Current conversation{' '}
              <small className="col-start-2 text-muted text-[11.5px] mt-[3px]">
                {messages.filter((m) => m.role === 'user').length} questions
              </small>
            </button>
          ) : (
            <p className="text-[12.5px] text-muted leading-[1.5]">
              Your recent conversations will appear here.
            </p>
          )}
        </div>
      )}
      <div className="font-mono font-semibold text-[11px] tracking-[1.15px] text-muted-2 pt-[27px] px-2.5 pb-2.5 flex justify-between items-center max-[760px]:hidden">
        YOUR LIBRARY <span>{documents.length.toString().padStart(2, '0')}</span>
      </div>
      <div className="flex flex-col gap-1 max-[760px]:hidden">
        {documents.map((doc) => (
          <div
            className="flex items-center gap-[9px] py-[9px] px-1.5 rounded-[7px] min-w-0 hover:bg-panel-raised group"
            key={doc.id}
          >
            <div className="w-8 h-9 flex-[0_0_32px] border border-[color-mix(in_srgb,#f18181_28%,var(--line))] bg-[color-mix(in_srgb,#f18181_9%,var(--panel))] text-[#e99494] grid place-items-center rounded-[6px]">
              <MdPictureAsPdf size={19} />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="text-[13px] font-semibold overflow-hidden text-ellipsis whitespace-nowrap max-w-[195px]"
                title={doc.name}
              >
                {doc.name}
              </div>
              <div className="text-[11.5px] text-muted mt-[3px]">
                {doc.pages} {doc.pages === 1 ? 'page' : 'pages'}{' '}
                <span className="px-[3px] text-muted-2">·</span>{' '}
                {formatSize(doc.size)}
                {doc.ingestTimeMs !== undefined && (
                  <>
                    <span className="px-[3px] text-muted-2">·</span>{' '}
                    {doc.ingestTimeMs}ms ingest
                  </>
                )}
              </div>
            </div>
            <button
              className="grid place-items-center w-[30px] h-[30px] border border-transparent rounded-[7px] bg-transparent text-muted hover:border-line hover:bg-panel-soft hover:text-text opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove document"
              onClick={() => onRemoveDocument(doc.id, doc.name)}
            >
              <MdClose size={16} />
            </button>
          </div>
        ))}
        {!documents.length && (
          <div className="my-[7px] mx-[3px] mb-[9px] border border-dashed border-line-strong rounded-lg py-[18px] px-2.5 text-center">
            <div className="w-9 h-9 grid place-items-center rounded-[10px] bg-panel-soft text-muted mx-auto mb-2.5">
              <MdUploadFile size={22} />
            </div>
            <p className="text-[13px] font-semibold m-0 mb-[5px]">
              Your documents live here
            </p>
            <span className="text-xs text-muted leading-[1.5] block">
              Add a PDF to start asking questions.
            </span>
          </div>
        )}
      </div>
      <button
        className="mt-[9px] w-full h-[38px] border border-dashed border-line-strong bg-transparent rounded-lg text-muted text-[13px] font-medium flex items-center justify-center gap-[7px] transition-[border-color,color] duration-150 hover:border-accent hover:text-text disabled:opacity-65 disabled:cursor-not-allowed max-[760px]:hidden"
        onClick={onOpenFileInput}
        disabled={uploading}
      >
        <MdAdd size={18} /> Add documents
      </button>
      <div className="flex-1 min-h-[15px] max-[760px]:hidden" />
      <div className="flex items-start gap-2.5 p-[11px] border border-line rounded-[9px] bg-panel-raised mb-3 max-[760px]:hidden">
        <div className="text-cyan pt-0.5">
          <MdSecurity size={18} />
        </div>
        <div>
          <strong className="text-xs font-semibold">Private by design</strong>
          <p className="text-[11.5px] leading-[1.55] text-muted mt-[5px] mb-0">
            Files are processed for this session and not saved to a database.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-[9px] pt-3 px-0.5 pb-0 border-t border-line max-[760px]:hidden">
        <div className="w-[34px] h-[34px] rounded-full grid place-items-center bg-panel-soft border border-line-strong font-heading font-bold text-sm text-accent">
          V
        </div>
        <div className="flex flex-col gap-[3px] flex-1">
          <strong className="text-[13px]">Personal workspace</strong>
          <span className="text-[11.5px] text-muted">Local session</span>
        </div>
        <button
          className="grid place-items-center w-[30px] h-[30px] border border-transparent rounded-[7px] bg-transparent text-muted hover:border-line hover:bg-panel-soft hover:text-text transition-colors"
          onClick={onToggleTheme}
          title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {dark ? <MdLightMode size={18} /> : <MdDarkMode size={18} />}
        </button>
      </div>
    </aside>
  );
}
