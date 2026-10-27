'use client';

import { useState } from 'react';
import Add from '@mui/icons-material/Add';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Circle from '@mui/icons-material/Circle';
import Close from '@mui/icons-material/Close';
import DarkMode from '@mui/icons-material/DarkMode';
import DeleteSweep from '@mui/icons-material/DeleteSweep';
import FileDownload from '@mui/icons-material/FileDownload';
import Forum from '@mui/icons-material/Forum';
import GraphicEq from '@mui/icons-material/GraphicEq';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import KeyboardCommandKey from '@mui/icons-material/KeyboardCommandKey';
import LightMode from '@mui/icons-material/LightMode';
import MenuBook from '@mui/icons-material/MenuBook';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import Search from '@mui/icons-material/Search';
import Security from '@mui/icons-material/Security';
import UploadFile from '@mui/icons-material/UploadFile';
import type { ChatMessage, DocumentRecord } from '@/lib/types';
import { DocumentIcon, getFormatBadgeColor } from '@/components/DocumentIcon';
import { downloadMarkdownReport, printPdfReport } from '@/lib/exportReport';

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
  onClearAllDocuments?: () => void;
  onOpenFileInput: () => void;
  onToggleTheme: () => void;
  selectedDocumentId?: string;
  onSelectDocument?: (docId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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
  onClearAllDocuments,
  onOpenFileInput,
  onToggleTheme,
  selectedDocumentId,
  onSelectDocument,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const [docFilter, setDocFilter] = useState('');

  const totalPages = documents.reduce((sum, d) => sum + d.pages, 0);
  const totalSize = documents.reduce((sum, d) => sum + d.size, 0);
  const filteredDocs = docFilter.trim()
    ? documents.filter((d) =>
        d.name.toLowerCase().includes(docFilter.toLowerCase().trim()),
      )
    : documents;
  if (collapsed) {
    return (
      <aside className="w-[60px] flex-[0_0_60px] h-screen sticky top-0 flex flex-col items-center border-r border-line bg-panel py-5 z-[5] max-[760px]:hidden transition-all duration-200">
        <button
          onClick={onToggleCollapse}
          className="h-10 w-10 rounded-xl bg-accent text-accent-ink grid place-items-center shadow-[0_4px_18px_color-mix(in_srgb,var(--accent)_14%,transparent)] hover:scale-105 transition-transform cursor-pointer"
          title="Expand sidebar"
        >
          <GraphicEq style={{ fontSize: 22 }} />
        </button>

        <div className="w-8 h-px bg-line my-4" />

        <button
          onClick={onClearConversation}
          className="w-10 h-10 rounded-lg grid place-items-center text-muted hover:text-text hover:bg-panel-soft transition-colors cursor-pointer"
          title="New conversation"
        >
          <Add style={{ fontSize: 20 }} />
        </button>

        <button
          onClick={onOpenFileInput}
          className="w-10 h-10 rounded-lg grid place-items-center text-muted hover:text-text hover:bg-panel-soft transition-colors cursor-pointer mt-1 relative"
          title={
            documents.length
              ? `${documents.length} documents loaded · Add more`
              : 'Add documents'
          }
        >
          <PictureAsPdf style={{ fontSize: 19 }} />
          {documents.length > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent text-accent-ink text-[9px] font-mono font-bold grid place-items-center">
              {documents.length}
            </span>
          )}
        </button>

        <div className="flex-1" />

        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-lg grid place-items-center text-muted hover:text-text hover:bg-panel-soft transition-colors cursor-pointer mb-2"
          title="Expand sidebar"
        >
          <ChevronRight style={{ fontSize: 20 }} />
        </button>

        <button
          onClick={onToggleTheme}
          className="w-10 h-10 rounded-lg grid place-items-center text-muted hover:text-text hover:bg-panel-soft transition-colors cursor-pointer"
          title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {dark ? <LightMode style={{ fontSize: 18 }} /> : <DarkMode style={{ fontSize: 18 }} />}
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-[var(--sidebar)] flex-[0_0_var(--sidebar)] h-screen sticky top-0 flex flex-col border-r border-line bg-panel pt-[27px] px-4 pb-3.5 z-[5] max-[760px]:relative max-[760px]:w-full max-[760px]:h-auto max-[760px]:p-[14px_16px] max-[760px]:border-r-0 max-[760px]:border-b max-[760px]:grid max-[760px]:grid-cols-[1fr_auto] max-[760px]:gap-x-2.5 transition-all duration-200">
      <div className="flex items-center justify-between pb-[27px] px-[7px] max-[760px]:p-0 max-[760px]:col-start-1 max-[760px]:row-start-1">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent text-accent-ink grid place-items-center shadow-[0_4px_18px_color-mix(in_srgb,var(--accent)_14%,transparent)] max-[760px]:h-9 max-[760px]:w-9">
            <GraphicEq style={{ fontSize: 24 }} />
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
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-muted-2 hover:text-text hover:bg-panel-soft transition-colors cursor-pointer max-[760px]:hidden"
            title="Collapse sidebar to expand workspace"
          >
            <ChevronLeft style={{ fontSize: 18 }} />
          </button>
        )}
      </div>
      <button
        className="h-11 flex items-center gap-[9px] px-3 border border-line-strong bg-panel-raised rounded-[9px] text-text text-[13.5px] font-semibold text-left transition-[border-color,background] duration-150 hover:border-muted-2 hover:bg-panel-soft max-[760px]:col-start-2 max-[760px]:row-start-1 max-[760px]:self-center max-[760px]:h-[38px] max-[760px]:text-[13px]"
        onClick={onClearConversation}
      >
        <Add style={{ fontSize: 19 }} /> New conversation{' '}
        <span className="ml-auto font-mono text-[11px] text-muted-2 border border-line py-[3px] px-1.5 rounded max-[760px]:hidden inline-flex items-center gap-1">
          <KeyboardCommandKey style={{ fontSize: 11 }} /> K
        </span>
      </button>
      <div className="font-mono font-semibold text-[11px] tracking-[1.15px] text-muted-2 pt-7 px-2.5 pb-2.5 max-[760px]:hidden">
        WORKSPACE
      </div>
      <button className="h-10 flex items-center gap-2.5 px-2.5 mb-2.5 text-text font-semibold border-0 bg-[color-mix(in_srgb,var(--accent)_10%,var(--panel))] rounded-[7px] text-left text-[13.5px] transition-[background,color] duration-150 max-[760px]:hidden">
        <MenuBook style={{ fontSize: 18 }} className="text-accent" /> Document chat
      </button>
      <button
        className="h-10 flex items-center gap-2.5 px-2.5 text-muted border-0 bg-transparent rounded-[7px] text-left text-[13.5px] transition-[background,color] duration-150 hover:text-text hover:bg-panel-raised max-[760px]:hidden group w-full"
        onClick={onToggleHistory}
      >
        <Forum style={{ fontSize: 18 }} className="text-muted-2 group-hover:text-text" />{' '}
        Conversation history{' '}
        <KeyboardArrowDown
          style={{ fontSize: 18 }}
          className={`ml-auto transition-transform ${showHistory ? 'rotate-180' : ''}`}
        />
      </button>
      {showHistory && (
        <div className="mt-[5px] mr-0 mb-0 ml-[23px] pl-2.5 border-l border-line max-[760px]:hidden">
          {messages.length ? (
            <div>
              <button
                className="bg-transparent border-0 text-text text-left grid grid-cols-[8px_1fr] gap-x-2 items-center py-2 text-[13px] w-full"
                onClick={onToggleHistory}
              >
                <Circle style={{ fontSize: 7 }} className="text-accent" /> Current conversation{' '}
                <small className="col-start-2 text-muted text-[11.5px] mt-[3px]">
                  {messages.filter((m) => m.role === 'user').length} questions
                </small>
              </button>
              <div className="flex items-center gap-2 mt-1 mb-2 pt-1.5 border-t border-line/60">
                <button
                  type="button"
                  onClick={() => downloadMarkdownReport(messages, documents)}
                  className="text-[11px] font-medium text-muted hover:text-accent flex items-center gap-1 hover:underline cursor-pointer"
                  title="Export conversation as Markdown"
                >
                  <FileDownload style={{ fontSize: 13 }} />
                  <span>Report (.md)</span>
                </button>
                <span className="text-muted-2 text-[10px]">&middot;</span>
                <button
                  type="button"
                  onClick={() => printPdfReport(messages, documents)}
                  className="text-[11px] font-medium text-muted hover:text-accent flex items-center gap-1 hover:underline cursor-pointer"
                  title="Export conversation as PDF"
                >
                  <PictureAsPdf style={{ fontSize: 13 }} />
                  <span>Report (.pdf)</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[12.5px] text-muted leading-[1.5]">
              Your recent conversations will appear here.
            </p>
          )}
        </div>
      )}
      <div className="pt-6 px-1.5 pb-2 max-[760px]:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-semibold text-[11px] tracking-[1.2px] text-muted-2">
              YOUR LIBRARY
            </span>
            {documents.length > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-panel-soft border border-line text-[10px] font-mono text-muted">
                {documents.length.toString().padStart(2, '0')}
              </span>
            )}
          </div>
          {documents.length > 0 && onClearAllDocuments && (
            <button
              onClick={onClearAllDocuments}
              className="group/clear inline-flex items-center gap-1 text-[11px] font-medium text-muted-2 hover:text-danger px-1.5 py-0.5 rounded border border-transparent hover:border-danger/20 hover:bg-danger/10 transition-all duration-150 cursor-pointer"
              title="Remove all documents from workspace"
            >
              <DeleteSweep
                style={{ fontSize: 14 }}
                className="group-hover/clear:scale-110 transition-transform duration-150"
              />
              <span>Clear all</span>
            </button>
          )}
        </div>
        {documents.length > 0 && (
          <div className="flex items-center justify-between text-[11px] text-muted mt-1.5 px-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
              <span>
                {documents.length} {documents.length === 1 ? 'file' : 'files'}
              </span>
              {totalPages > 0 && (
                <>
                  <span className="text-muted-2">·</span>
                  <span className="font-mono text-[10.5px]">
                    {totalPages.toLocaleString()} {totalPages === 1 ? 'page' : 'pages'}
                  </span>
                </>
              )}
            </span>
            {totalSize > 0 && (
              <span className="font-mono text-[10px] text-muted-2">
                {formatSize(totalSize)}
              </span>
            )}
          </div>
        )}
      </div>
      {documents.length > 4 && (
        <div className="px-1 mb-2 max-[760px]:hidden">
          <div className="h-[30px] flex items-center gap-1.5 px-2 bg-panel-soft border border-line rounded-md text-xs text-muted transition-colors hover:border-muted-2 focus-within:border-muted">
            <Search style={{ fontSize: 14 }} className="text-muted-2" />
            <input
              type="text"
              placeholder="Filter documents…"
              value={docFilter}
              onChange={(e) => setDocFilter(e.target.value)}
              className="bg-transparent border-0 outline-none text-text text-[11.5px] w-full placeholder:text-muted-2"
            />
            {docFilter && (
              <button
                onClick={() => setDocFilter('')}
                className="bg-transparent border-0 text-muted p-0 hover:text-text cursor-pointer"
                title="Clear filter"
              >
                <Close style={{ fontSize: 12 }} />
              </button>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1 max-[760px]:hidden overflow-y-auto max-h-[calc(100vh-420px)] pr-1">
        {filteredDocs.map((doc) => {
          const isSelected = selectedDocumentId === doc.id;
          const badge = getFormatBadgeColor(doc.format, doc.name);
          return (
            <div
              className={`flex items-center gap-[9px] py-[9px] px-2 rounded-[7px] min-w-0 transition-colors cursor-pointer group ${
                isSelected
                  ? 'bg-panel-soft border border-line-strong'
                  : 'hover:bg-panel-raised border border-transparent'
              }`}
              key={doc.id}
              onClick={() => onSelectDocument?.(doc.id)}
              title={`Click to open ${doc.name} in reader`}
            >
              <div
                className={`w-8 h-9 flex-[0_0_32px] border rounded-[6px] grid place-items-center transition-colors ${
                  isSelected
                    ? 'border-accent/40 bg-accent/15 text-accent'
                    : `${badge.border} ${badge.bg}`
                }`}
              >
                <DocumentIcon format={doc.format} filename={doc.name} size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`text-[13px] font-semibold overflow-hidden text-ellipsis whitespace-nowrap max-w-[195px] flex items-center gap-1.5 ${
                    isSelected ? 'text-text' : ''
                  }`}
                  title={doc.name}
                >
                  <span className="truncate">{doc.name}</span>
                </div>
                <div className="text-[11px] text-muted mt-[3px] flex items-center gap-1">
                  <span
                    className={`text-[9.5px] font-mono px-1 py-0.2 rounded border uppercase font-medium ${badge.bg} ${badge.border} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                  <span>
                    {doc.pages} {doc.pages === 1 ? 'page' : 'pages'}
                  </span>
                  <span className="px-[2px] text-muted-2">·</span>
                  <span>{formatSize(doc.size)}</span>
                </div>
              </div>
              <button
                className="grid place-items-center w-[30px] h-[30px] border border-transparent rounded-[7px] bg-transparent text-muted hover:border-line hover:bg-panel-soft hover:text-text opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove document"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveDocument(doc.id, doc.name);
                }}
              >
                <Close style={{ fontSize: 16 }} />
              </button>
            </div>
          );
        })}
        {Boolean(docFilter && !filteredDocs.length) && (
          <div className="py-4 text-center text-xs text-muted">
            No documents matching &ldquo;{docFilter}&rdquo;
          </div>
        )}
        {!documents.length && (
          <div className="my-[7px] mx-[3px] mb-[9px] border border-dashed border-line-strong rounded-lg py-[18px] px-2.5 text-center">
            <div className="w-9 h-9 grid place-items-center rounded-[10px] bg-panel-soft text-muted mx-auto mb-2.5">
              <UploadFile style={{ fontSize: 22 }} />
            </div>
            <p className="text-[13px] font-semibold m-0 mb-[5px]">
              Your documents live here
            </p>
            <span className="text-xs text-muted leading-[1.5] block">
              Add documents to start asking questions.
            </span>
          </div>
        )}
      </div>
      <button
        className="mt-[9px] w-full h-[38px] border border-dashed border-line-strong bg-transparent rounded-lg text-muted text-[13px] font-medium flex items-center justify-center gap-[7px] transition-[border-color,color] duration-150 hover:border-accent hover:text-text disabled:opacity-65 disabled:cursor-not-allowed max-[760px]:hidden"
        onClick={onOpenFileInput}
        disabled={uploading}
      >
        <Add style={{ fontSize: 18 }} /> Add documents
      </button>
      <div className="flex-1 min-h-[15px] max-[760px]:hidden" />
      <div className="flex items-start gap-2.5 p-[11px] border border-line rounded-[9px] bg-panel-raised mb-3 max-[760px]:hidden">
        <div className="text-cyan pt-0.5">
          <Security style={{ fontSize: 18 }} />
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
          {dark ? <LightMode style={{ fontSize: 18 }} /> : <DarkMode style={{ fontSize: 18 }} />}
        </button>
      </div>
    </aside>
  );
}
