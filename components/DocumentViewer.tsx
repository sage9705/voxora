'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Check from '@mui/icons-material/Check';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Close from '@mui/icons-material/Close';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Fullscreen from '@mui/icons-material/Fullscreen';
import FullscreenExit from '@mui/icons-material/FullscreenExit';
import QuestionAnswer from '@mui/icons-material/QuestionAnswer';
import Search from '@mui/icons-material/Search';
import type { DocumentRecord } from '@/lib/types';
import { DocumentIcon, getFormatBadgeColor } from '@/components/DocumentIcon';

type DocumentViewerProps = {
  documents: DocumentRecord[];
  activeDocumentId?: string;
  activePage?: number;
  highlightText?: string;
  onSelectDocument: (docId: string) => void;
  onCloseViewer: () => void;
  onAskAboutPage?: (page: number, docName: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
};

export function DocumentViewer({
  documents,
  activeDocumentId,
  activePage: externalPage,
  highlightText,
  onSelectDocument,
  onCloseViewer,
  onAskAboutPage,
  isExpanded = false,
  onToggleExpand,
}: DocumentViewerProps) {
  const currentDoc =
    documents.find((d) => d.id === activeDocumentId) ?? documents[0];
  const badge = getFormatBadgeColor(currentDoc?.format, currentDoc?.name);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [copiedPage, setCopiedPage] = useState<number | null>(null);

  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Sync external page navigation (e.g. from citation click)
  useEffect(() => {
    if (externalPage && externalPage >= 1) {
      setCurrentPage(externalPage);
    }
  }, [externalPage]);

  const pagesData = useMemo(() => {
    if (!currentDoc) return [];

    let raw = currentDoc.text;
    raw = raw.replace(/^(?:\s*---\s*PAGE\s*BREAK\s*---\s*)+/i, '');

    const markerRegex = /(?:^|\n)\s*---\s*PAGE\s*BREAK\s*---\s*(?:\n|$)/i;
    if (markerRegex.test(raw)) {
      const parts = raw
        .split(markerRegex)
        .map((t) => t.replace(/^(?:\s*---\s*PAGE\s*BREAK\s*---\s*)+/i, '').trim())
        .filter((t) => t.length > 0);

      return parts.map((text, idx) => ({
        pageNumber: idx + 1,
        text,
      }));
    }

    const pageMap = new Map<number, string[]>();
    for (const chunk of currentDoc.chunks) {
      const list = pageMap.get(chunk.page) ?? [];
      list.push(chunk.text);
      pageMap.set(chunk.page, list);
    }

    const result: Array<{ pageNumber: number; text: string }> = [];
    const maxPage = Math.max(currentDoc.pages, pageMap.size, 1);
    for (let p = 1; p <= maxPage; p++) {
      const rawPage = pageMap.get(p)?.join('\n\n') ?? '';
      result.push({
        pageNumber: p,
        text: rawPage.replace(/^(?:\s*---\s*PAGE\s*BREAK\s*---\s*)+/i, '').trim(),
      });
    }
    return result;
  }, [currentDoc]);

  const totalPages = Math.max(currentDoc?.pages ?? 1, pagesData.length, 1);
  const activePageData =
    pagesData.find((p) => p.pageNumber === currentPage) ?? pagesData[0];

  useEffect(() => {
    if (highlightText && pageContainerRef.current) {
      const el = pageContainerRef.current.querySelector('.passage-highlight');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightText, currentPage]);

  const handleCopy = (text: string, pageNum: number) => {
    void navigator.clipboard.writeText(text);
    setCopiedPage(pageNum);
    setTimeout(() => setCopiedPage(null), 2000);
  };

  if (!currentDoc) {
    return (
      <div className="border border-line bg-panel rounded-xl p-8 text-center text-muted">
        <DocumentIcon size={32} className="mx-auto mb-2 text-muted-2" />
        <p>No document selected</p>
      </div>
    );
  }

  const renderFormattedDocumentContent = (rawText: string) => {
    let text = rawText
      .replace(/\u0000/g, '')
      .replace(/^(?:\s*---\s*PAGE\s*BREAK\s*---\s*)+/gi, '')
      .replace(/(?:\s*---\s*PAGE\s*BREAK\s*---\s*)+$/gi, '')
      .trim();

    if (!text) {
      return (
        <p className="text-muted italic text-sm py-4 text-center">
          [Empty page or image-only content with no extractable text]
        </p>
      );
    }

    text = text.replace(/([a-zA-Z0-9])\s*-\s*\n\s*([a-zA-Z0-9])/g, '$1-$2');
    text = text.replace(/([a-zA-Z0-9)])\s*-\s*([a-zA-Z0-9(])/g, '$1-$2');

    const query = searchQuery.trim().toLowerCase();
    const highlightTarget = highlightText?.trim().toLowerCase();

    function renderSearchMatches(segment: string): React.ReactNode {
      if (!query || !segment.toLowerCase().includes(query)) {
        return segment;
      }
      const parts = segment.split(new RegExp(`(${query})`, 'gi'));
      return (
        <>
          {parts.map((part, i) =>
            part.toLowerCase() === query ? (
              <mark
                key={i}
                className="bg-amber-400/30 text-amber-200 border-b border-amber-400 px-0.5 rounded"
              >
                {part}
              </mark>
            ) : (
              part
            ),
          )}
        </>
      );
    }

    function renderInlineMatches(segment: string): React.ReactNode {
      if (!segment) return null;

      if (highlightTarget && highlightTarget.length > 15) {
        const lower = segment.toLowerCase();
        const startIdx = lower.indexOf(highlightTarget);
        if (startIdx !== -1) {
          const before = segment.slice(0, startIdx);
          const matched = segment.slice(
            startIdx,
            startIdx + highlightTarget.length,
          );
          const after = segment.slice(startIdx + highlightTarget.length);
          return (
            <>
              {renderSearchMatches(before)}
              <mark className="passage-highlight bg-accent/25 text-text border-b-2 border-accent px-1 py-0.5 rounded animate-[pulse_2s_ease-in-out_2]">
                {matched}
              </mark>
              {renderSearchMatches(after)}
            </>
          );
        }
      }

      return renderSearchMatches(segment);
    }

    const rawLines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l !== '---PAGE BREAK---');
    const elements: React.ReactNode[] = [];
    let idx = 0;

    if (currentPage === 1 && rawLines.length >= 2) {
      const isHeader =
        !rawLines[0].startsWith('•') &&
        !rawLines[0].startsWith('[]') &&
        rawLines[0].length < 40 &&
        !rawLines[0].includes('|');

      if (isHeader) {
        const name = rawLines[0];
        let title = '';
        let contactLine = '';
        let linksLine = '';
        idx = 1;

        if (
          idx < rawLines.length &&
          !rawLines[idx].includes('|') &&
          rawLines[idx].length < 45 &&
          !/^[A-Z\s]{4,}$/.test(rawLines[idx])
        ) {
          title = rawLines[idx];
          idx++;
        }
        if (
          idx < rawLines.length &&
          (rawLines[idx].includes('|') ||
            rawLines[idx].includes('@') ||
            rawLines[idx].includes('+'))
        ) {
          contactLine = rawLines[idx];
          idx++;
        }
        if (
          idx < rawLines.length &&
          (rawLines[idx].includes('linkedin') ||
            rawLines[idx].includes('github') ||
            rawLines[idx].includes('http') ||
            rawLines[idx].includes('|'))
        ) {
          linksLine = rawLines[idx];
          idx++;
        }

        elements.push(
          <div
            key="doc-header"
            className="text-center pb-4 mb-4 border-b border-line/50"
          >
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text uppercase">
              {renderInlineMatches(name)}
            </h1>
            {title && (
              <div className="text-[14px] sm:text-[15px] font-semibold text-accent/90 mt-1">
                {renderInlineMatches(title)}
              </div>
            )}
            {contactLine && (
              <div className="text-xs text-muted mt-2 leading-relaxed">
                {renderInlineMatches(contactLine)}
              </div>
            )}
            {linksLine && (
              <div className="text-xs text-accent mt-1.5 flex flex-wrap justify-center gap-x-3 gap-y-1">
                {linksLine.split('|').map((part, pIdx) => {
                  const trimmed = part.trim();
                  const isUrl =
                    trimmed.startsWith('http') ||
                    trimmed.startsWith('www') ||
                    trimmed.includes('.com') ||
                    trimmed.includes('.org');
                  const href =
                    isUrl && !trimmed.startsWith('http')
                      ? `https://${trimmed}`
                      : trimmed;
                  return isUrl ? (
                    <a
                      key={pIdx}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-accent"
                    >
                      {renderInlineMatches(trimmed)}
                    </a>
                  ) : (
                    <span key={pIdx}>{renderInlineMatches(trimmed)}</span>
                  );
                })}
              </div>
            )}
          </div>,
        );
      }
    }

    while (idx < rawLines.length) {
      const line = rawLines[idx];

      const isSectionHeading =
        /^(?:PROFESSIONAL SUMMARY|PROFESSIONAL EXPERIENCE|TECHNICAL SKILLS|EDUCATION|PROJECTS|CERTIFICATIONS|CORE COMPETENCIES|WORK EXPERIENCE|SUMMARY|SKILLS|PUBLICATIONS|AWARDS)$/i.test(
          line,
        ) ||
        (/^[A-Z0-9\s/&,.-]{4,40}$/.test(line) &&
          !line.endsWith('.') &&
          !line.startsWith('•') &&
          !line.startsWith('[]') &&
          !line.includes('|'));

      if (isSectionHeading) {
        const cleanHeading = line.replace(/^#+\s*/, '');
        elements.push(
          <div key={`heading-${idx}`} className="mt-6 mb-3 first:mt-0">
            <h2 className="text-[13.5px] font-bold text-accent tracking-[0.6px] uppercase font-heading">
              {renderInlineMatches(cleanHeading)}
            </h2>
            <div className="border-b-2 border-accent/40 w-full mt-1.5 mb-2.5" />
          </div>,
        );
        idx++;
        continue;
      }

      const isExpCompany =
        idx + 1 < rawLines.length &&
        /^[A-Za-z0-9\s,&.-]{3,35}$/.test(line) &&
        !line.startsWith('•') &&
        !line.startsWith('[]') &&
        !line.includes('|') &&
        rawLines.some(
          (l, i) =>
            i > idx &&
            i < idx + 5 &&
            /(?:Present|\d{4}|Remote|Contract|Full-time)/i.test(l),
        );

      if (isExpCompany && !line.includes('.') && line.length < 35) {
        const company = line;
        let role = '';
        let dates = '';
        let location = '';
        let contract = '';
        idx++;

        if (
          idx < rawLines.length &&
          !/(?:Present|\d{4})/i.test(rawLines[idx]) &&
          !rawLines[idx].startsWith('•') &&
          !rawLines[idx].startsWith('[]')
        ) {
          role = rawLines[idx];
          idx++;
        }
        if (
          idx < rawLines.length &&
          /(?:Present|\d{4})/i.test(rawLines[idx])
        ) {
          dates = rawLines[idx];
          idx++;
        }
        if (
          idx < rawLines.length &&
          /^[A-Z]{2,4}$|^[A-Za-z\s,]+$/.test(rawLines[idx]) &&
          rawLines[idx].length < 25 &&
          !rawLines[idx].startsWith('•') &&
          !rawLines[idx].startsWith('[]')
        ) {
          location = rawLines[idx];
          idx++;
        }
        if (
          idx < rawLines.length &&
          /(?:Remote|Contract|Full-time|Part-time)/i.test(rawLines[idx])
        ) {
          contract = rawLines[idx];
          idx++;
        }

        elements.push(
          <div
            key={`exp-head-${idx}`}
            className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mt-4 mb-2.5"
          >
            <div>
              <div className="font-bold text-[14.5px] text-accent tracking-tight">
                {renderInlineMatches(company)}
              </div>
              {role && (
                <div className="text-[13px] italic text-text font-medium mt-0.5">
                  {renderInlineMatches(role)}
                </div>
              )}
            </div>
            <div className="sm:text-right text-xs text-muted shrink-0">
              {dates && (
                <div className="font-semibold text-text">
                  {renderInlineMatches(dates)}
                </div>
              )}
              {location && <div>{renderInlineMatches(location)}</div>}
              {contract && (
                <div className="italic text-muted-2">
                  {renderInlineMatches(contract)}
                </div>
              )}
            </div>
          </div>,
        );
        continue;
      }

      const isBulletStart =
        line.startsWith('•') ||
        line.startsWith('[]') ||
        line.startsWith('[ ]') ||
        /^[-*]\s+/.test(line);

      if (isBulletStart) {
        let bulletText = line.replace(/^(?:•|\[\]|\[\s*\]|[-*])\s*/, '');
        idx++;

        while (
          idx < rawLines.length &&
          !rawLines[idx].startsWith('•') &&
          !rawLines[idx].startsWith('[]') &&
          !rawLines[idx].startsWith('[ ]') &&
          !/^[-*]\s+/.test(rawLines[idx]) &&
          !/^(?:PROFESSIONAL SUMMARY|PROFESSIONAL EXPERIENCE|TECHNICAL SKILLS|EDUCATION|PROJECTS|CERTIFICATIONS)$/i.test(
            rawLines[idx],
          ) &&
          !(
            rawLines[idx].length < 35 &&
            /^[A-Za-z0-9\s,&.-]{3,35}$/.test(rawLines[idx]) &&
            idx + 2 < rawLines.length &&
            /(?:Present|\d{4})/i.test(rawLines[idx + 1] + rawLines[idx + 2])
          )
        ) {
          bulletText += ' ' + rawLines[idx];
          idx++;
        }

        elements.push(
          <div
            key={`bullet-${idx}`}
            className="flex items-start gap-2.5 my-2 pl-0.5"
          >
            <span className="text-accent text-[13px] mt-0.5 shrink-0 select-none font-bold leading-none">
              •
            </span>
            <div className="text-[13px] text-text leading-[1.65] flex-1 text-justify sm:text-left">
              {renderInlineMatches(bulletText)}
            </div>
          </div>,
        );
        continue;
      }

      let paraText = line;
      idx++;
      while (
        idx < rawLines.length &&
        !rawLines[idx].startsWith('•') &&
        !rawLines[idx].startsWith('[]') &&
        !rawLines[idx].startsWith('[ ]') &&
        !/^[-*]\s+/.test(rawLines[idx]) &&
        !/^(?:PROFESSIONAL SUMMARY|PROFESSIONAL EXPERIENCE|TECHNICAL SKILLS|EDUCATION|PROJECTS|CERTIFICATIONS)$/i.test(
          rawLines[idx],
        )
      ) {
        paraText += ' ' + rawLines[idx];
        idx++;
      }

      elements.push(
        <p
          key={`para-${idx}`}
          className="my-2.5 text-[13px] text-text leading-[1.7] text-justify sm:text-left"
        >
          {renderInlineMatches(paraText)}
        </p>,
      );
    }

    return <div className="space-y-1">{elements}</div>;
  };

  const fontSizeClass =
    fontSize === 'sm'
      ? 'text-[12.5px] leading-[1.65]'
      : fontSize === 'lg'
        ? 'text-[15.5px] leading-[1.8]'
        : 'text-[14px] leading-[1.7]';

  return (
    <div className="border border-line bg-panel rounded-xl overflow-hidden flex flex-col flex-1 h-full min-h-0 shadow-sm transition-all duration-200">
      {/* Top Document Tabs (when multiple files uploaded) */}
      <div className="h-11 border-b border-line bg-panel-soft/60 px-3 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto no-scrollbar">
          {documents.map((doc) => {
            const isSelected = doc.id === currentDoc.id;
            return (
              <button
                key={doc.id}
                onClick={() => {
                  onSelectDocument(doc.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-panel-raised border border-line-strong text-text font-semibold shadow-sm'
                    : 'text-muted hover:text-text hover:bg-panel-raised/50 border border-transparent'
                }`}
                title={doc.name}
              >
                <DocumentIcon
                  format={doc.format}
                  filename={doc.name}
                  size={14}
                />
                <span className="max-w-[150px] truncate">{doc.name}</span>
                <span className="text-[10px] text-muted font-mono">
                  {doc.pages}p
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1 rounded text-muted hover:text-text hover:bg-panel-soft transition-colors cursor-pointer"
              title={
                isExpanded ? 'Restore split layout' : 'Expand reader view'
              }
            >
              {isExpanded ? (
                <FullscreenExit style={{ fontSize: 17 }} />
              ) : (
                <Fullscreen style={{ fontSize: 17 }} />
              )}
            </button>
          )}
          <button
            onClick={onCloseViewer}
            className="p-1 rounded text-muted hover:text-text hover:bg-panel-soft transition-colors cursor-pointer"
            title="Close document viewer"
          >
            <Close style={{ fontSize: 17 }} />
          </button>
        </div>
      </div>

      {/* Reader Controls Toolbar */}
      <div className="h-12 border-b border-line bg-panel px-4 flex items-center justify-between gap-3 text-xs">
        {/* Page Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded border border-line bg-panel-soft text-muted hover:text-text hover:border-line-strong disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <ChevronLeft style={{ fontSize: 16 }} />
          </button>

          <div className="flex items-center gap-1 font-mono text-[11.5px] px-1 text-muted">
            <span className="text-muted-2">Page</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                  setCurrentPage(val);
                }
              }}
              className="w-12 h-6 text-center rounded border border-line bg-bg text-text font-mono text-xs focus:border-accent outline-none"
            />
            <span className="text-muted-2">/ {totalPages}</span>
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 rounded border border-line bg-panel-soft text-muted hover:text-text hover:border-line-strong disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <ChevronRight style={{ fontSize: 16 }} />
          </button>
        </div>

        {/* Search within document */}
        <div className="flex items-center gap-1.5 flex-1 max-w-[220px]">
          <div className="h-7 w-full flex items-center gap-1.5 px-2 bg-bg border border-line rounded-md text-xs text-muted focus-within:border-accent">
            <Search style={{ fontSize: 14 }} className="text-muted-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Find on page…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-0 outline-none text-text text-[11.5px] w-full placeholder:text-muted-2"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-muted hover:text-text cursor-pointer"
              >
                <Close style={{ fontSize: 12 }} />
              </button>
            )}
          </div>
        </div>

        {/* Font Size & Ask Page */}
        <div className="flex items-center gap-2">
          {/* Font scale buttons */}
          <div className="flex items-center border border-line rounded-md overflow-hidden bg-panel-soft">
            <button
              onClick={() => setFontSize('sm')}
              className={`px-1.5 py-1 text-[10px] font-mono transition-colors ${
                fontSize === 'sm'
                  ? 'bg-accent text-accent-ink font-bold'
                  : 'text-muted hover:text-text'
              }`}
              title="Small text"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('base')}
              className={`px-1.5 py-1 text-[11px] font-mono transition-colors border-x border-line ${
                fontSize === 'base'
                  ? 'bg-accent text-accent-ink font-bold'
                  : 'text-muted hover:text-text'
              }`}
              title="Standard text"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-1.5 py-1 text-[12px] font-mono transition-colors ${
                fontSize === 'lg'
                  ? 'bg-accent text-accent-ink font-bold'
                  : 'text-muted hover:text-text'
              }`}
              title="Large text"
            >
              A+
            </button>
          </div>

          {/* Quick ask about page */}
          {onAskAboutPage && (
            <button
              onClick={() => onAskAboutPage(currentPage, currentDoc.name)}
              className="inline-flex items-center gap-1 text-[11.5px] font-medium text-accent hover:text-accent-ink bg-accent/10 hover:bg-accent border border-accent/20 px-2 py-1 rounded-md transition-all duration-150 cursor-pointer"
              title="Ask AI to analyze this page"
            >
              <QuestionAnswer style={{ fontSize: 13 }} />
              <span className="hidden sm:inline">Ask page</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Document Content Canvas */}
      <div
        ref={pageContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-7 bg-bg/50 flex flex-col items-center scroll-smooth"
      >
        <div className="w-full max-w-[800px] bg-panel-raised border border-line rounded-lg shadow-sm p-6 sm:p-10 my-0 sm:my-2 transition-all">
          {/* Page Card Header Banner */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-line text-xs text-muted-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-[11px] px-2 py-0.5 rounded bg-panel-soft border border-line text-accent">
                PAGE {currentPage}
              </span>
              <span
                className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border uppercase font-medium ${badge.bg} ${badge.border} ${badge.text}`}
              >
                {badge.label}
              </span>
              <span className="truncate max-w-[280px] text-muted">
                {currentDoc.name}
              </span>
            </div>

            <button
              onClick={() =>
                handleCopy(activePageData?.text ?? '', currentPage)
              }
              className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-text hover:bg-panel-soft px-2 py-1 rounded transition-colors cursor-pointer"
              title="Copy page text"
            >
              {copiedPage === currentPage ? (
                <>
                  <Check style={{ fontSize: 13 }} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <ContentCopy style={{ fontSize: 13 }} />
                  <span>Copy text</span>
                </>
              )}
            </button>
          </div>

          {/* Page Text Body */}
          <div className={`font-sans text-text select-text ${fontSizeClass}`}>
            {renderFormattedDocumentContent(activePageData?.text ?? '')}
          </div>

          {/* Bottom Page Footer Indicator */}
          <div className="mt-8 pt-4 border-t border-line/60 flex items-center justify-between text-[11px] text-muted-2 font-mono">
            <span>
              Voxora Document Intelligence · {currentDoc.pages} pages
            </span>
            <span>
              {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
