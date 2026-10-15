'use client';

import { useEffect, useRef } from 'react';
import {
  MdBolt,
  MdDeleteOutline,
  MdForum,
  MdGraphicEq,
  MdMenuBook,
  MdNorthEast,
  MdPerson,
  MdVolumeUp,
} from 'react-icons/md';
import type { ChatMessage } from '@/lib/types';

type ChatAreaProps = {
  documentsCount: number;
  messages: ChatMessage[];
  asking: boolean;
  autoSpeak: boolean;
  starters: Array<{ label: string; question: string }>;
  onToggleAutoSpeak: () => void;
  onToggleHistory: () => void;
  onClearConversation: () => void;
  onSelectStarter: (question: string) => void;
  onReadAloud: (text: string) => void;
  children?: React.ReactNode;
};

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\[Page\s*\d+\]|`[^`]+`)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong className="font-semibold text-text" key={match.index}>
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('[Page') && token.endsWith(']')) {
      parts.push(
        <span
          className="inline-block py-px px-1.5 text-[11px] rounded bg-panel-raised border border-line-strong text-accent my-0 mx-[3px] font-mono"
          key={match.index}
        >
          {token.slice(1, -1)}
        </span>,
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          className="font-mono text-[13px] py-0.5 px-[5px] rounded bg-panel-raised border border-line"
          key={match.index}
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      parts.push(token);
    }
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }
  return parts.length ? parts : [text];
}

function FormattedContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ol' | 'ul'; items: React.ReactNode[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ol') {
        elements.push(
          <ol
            key={`ol-${elements.length}`}
            className="my-2 pl-[22px] flex flex-col gap-1.5 list-decimal [&>li]:leading-[1.6]"
          >
            {currentList.items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ol>,
        );
      } else {
        elements.push(
          <ul
            key={`ul-${elements.length}`}
            className="my-2 pl-[22px] flex flex-col gap-1.5 list-disc [&>li]:leading-[1.6]"
          >
            {currentList.items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>,
        );
      }
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Numbered lists e.g. "1. Step description"
    const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.+)$/);
    if (numMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(parseInline(numMatch[2]));
      continue;
    }

    // Bullet lists e.g. "- Description" or "* Description"
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(parseInline(bulletMatch[1]));
      continue;
    }

    flushList();

    // Blockquote e.g. "> Warning: ..."
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.replace(/^>\s*/, '');
      elements.push(
        <blockquote
          key={`q-${i}`}
          className="my-2.5 mx-0 mb-3 py-2.5 px-3.5 border-l-[3px] border-accent bg-panel-raised rounded-r-[7px] text-text text-sm"
        >
          {parseInline(quoteText)}
        </blockquote>,
      );
      continue;
    }

    // Headers e.g. "### Heading"
    if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
      const headingText = trimmed.replace(/^#+\s*/, '');
      elements.push(
        <h4
          key={`h-${i}`}
          className="text-[15px] font-bold my-3.5 mb-1.5 text-text tracking-[-0.2px] first:mt-0"
        >
          {parseInline(headingText)}
        </h4>,
      );
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={`p-${i}`} className="mt-0 mb-2.5 last:mb-0">
        {parseInline(trimmed)}
      </p>,
    );
  }

  flushList();

  return (
    <div className="text-[15px] leading-[1.7] text-text [overflow-wrap:anywhere] max-[760px]:text-[14px]">
      {elements}
    </div>
  );
}

export function ChatArea({
  documentsCount,
  messages,
  asking,
  autoSpeak,
  starters,
  onToggleAutoSpeak,
  onToggleHistory,
  onClearConversation,
  onSelectStarter,
  onReadAloud,
  children,
}: ChatAreaProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, asking]);

  return (
    <div className="border border-line bg-panel rounded-xl overflow-hidden min-h-[480px] flex flex-col flex-1 mb-[25px] max-[760px]:min-h-[500px] max-[760px]:mb-4">
      <div className="h-16 flex-[0_0_64px] border-b border-line flex items-center justify-between px-5 max-[760px]:px-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border border-line bg-panel-raised rounded-[9px] grid place-items-center text-accent">
            <MdMenuBook size={18} />
          </div>
          <div className="flex flex-col gap-1">
            <strong className="text-[13.5px] font-semibold">Document conversation</strong>
            <span className="text-xs text-muted max-[760px]:text-[11.5px] flex items-center">
              {documentsCount} {documentsCount === 1 ? 'document' : 'documents'}{' '}
              in context{' '}
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#9bd87c] mx-1.5" />{' '}
              Ready to ask
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`h-[33px] flex items-center gap-1.5 border border-transparent rounded-md bg-transparent text-xs px-2.5 transition-[border-color,background,color] duration-150 hover:border-muted-2 hover:bg-panel-soft hover:text-text max-[760px]:text-[0px] max-[760px]:gap-0 max-[760px]:px-1.5 [&_svg]:max-[760px]:w-[17px] [&_svg]:max-[760px]:h-[17px] ${
              autoSpeak ? 'border-muted-2 bg-panel-soft text-text' : 'text-muted'
            }`}
            onClick={onToggleAutoSpeak}
            title={autoSpeak ? 'Spoken answers enabled' : 'Spoken answers muted'}
          >
            <MdVolumeUp size={16} />{' '}
            {autoSpeak ? 'Voice answers: On' : 'Voice answers: Off'}
          </button>
          <button
            className="h-[33px] flex items-center gap-1.5 border border-transparent rounded-md bg-transparent text-muted text-xs px-2.5 transition-[border-color,background,color] duration-150 hover:border-muted-2 hover:bg-panel-soft hover:text-text max-[760px]:text-[0px] max-[760px]:gap-0 max-[760px]:px-1.5 [&_svg]:max-[760px]:w-[17px] [&_svg]:max-[760px]:h-[17px]"
            onClick={onToggleHistory}
          >
            <MdForum size={16} /> History
          </button>
          <button
            className="grid place-items-center w-[30px] h-[30px] border border-transparent rounded-[7px] bg-transparent text-muted hover:border-line hover:bg-panel-soft hover:text-text transition-colors"
            onClick={onClearConversation}
            title="Clear conversation"
          >
            <MdDeleteOutline size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[320px] max-h-[calc(100vh-490px)] overflow-y-auto py-6 px-[25px] max-[1050px]:py-5 max-[1050px]:px-[17px] max-[760px]:max-h-none max-[760px]:py-[18px] max-[760px]:px-3.5">
        {!messages.length ? (
          <div className="max-w-[620px] mx-auto mt-5 mb-0 text-center max-[760px]:mt-3.5">
            <div className="h-14 w-14 grid place-items-center rounded-[18px] border border-line-strong bg-panel-raised text-accent mx-auto mb-4">
              <MdGraphicEq size={30} />
            </div>
            <h2 className="font-heading font-semibold text-[22px] tracking-[-0.7px] mt-0 mb-2.5">
              Let&apos;s find something.
            </h2>
            <p className="text-sm text-muted mt-0 mb-6">
              Ask a question about your documents or start with one of these.
            </p>
            <div className="grid grid-cols-3 gap-[11px] text-left max-[760px]:grid-cols-1">
              {starters.map((item) => (
                <button
                  key={item.label}
                  className="relative min-h-[104px] py-3.5 px-[13px] border border-line bg-panel-raised rounded-[9px] text-text text-left flex flex-col gap-2.5 transition-[border-color,transform] duration-150 hover:border-line-strong hover:-translate-y-px max-[760px]:min-h-[68px] max-[760px]:gap-2"
                  onClick={() => onSelectStarter(item.question)}
                >
                  <span className="font-mono font-semibold text-[11px] text-accent uppercase tracking-[0.3px]">
                    {item.label}
                  </span>
                  <strong className="text-[13px] leading-[1.5] font-medium max-w-[calc(100%-14px)] max-[760px]:max-w-[90%] max-[760px]:text-[12.5px]">
                    {item.question}
                  </strong>
                  <MdNorthEast size={16} className="absolute right-[11px] top-[11px] text-muted-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-[25px] max-w-[800px] mx-auto my-0">
            {messages.map((message) => (
              <div className="flex items-start gap-[13px] max-[760px]:gap-2.5" key={message.id}>
                <div
                  className={`h-[34px] w-[34px] flex-[0_0_34px] rounded-[10px] grid place-items-center text-[13px] font-bold max-[760px]:h-[30px] max-[760px]:w-[30px] max-[760px]:flex-[0_0_30px] ${
                    message.role === 'assistant'
                      ? 'bg-accent text-accent-ink'
                      : 'bg-panel-soft border border-line-strong text-muted'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <MdGraphicEq size={20} />
                  ) : (
                    <MdPerson size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="min-h-[26px] flex flex-wrap items-center gap-x-2.5 gap-y-2 mb-1.5">
                    <strong className="text-[13px] font-bold">
                      {message.role === 'assistant' ? 'Voxora' : 'You'}
                    </strong>
                    <span className="text-xs text-muted-2">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {message.role === 'assistant' && (
                      <>
                        <span className="py-[3px] px-[7px] border border-line rounded text-[11px] text-muted">
                          {message.mode === 'local' ? 'Local retrieval' : 'AI grounded'}
                        </span>
                        {message.latencyMs !== undefined && (
                          <span
                            className="py-[3px] px-[7px] border border-line rounded text-[11px] text-muted inline-flex items-center gap-1"
                            title="Processing latency"
                          >
                            <MdBolt size={13} className="text-accent" /> {message.latencyMs}ms
                          </span>
                        )}
                        {message.audioLatencyMs !== undefined && (
                          <span
                            className="py-[3px] px-[7px] border border-line rounded text-[11px] text-muted inline-flex items-center gap-1"
                            title="Question to first audible answer"
                          >
                            <MdVolumeUp size={13} className="text-accent" /> {message.audioLatencyMs}ms to audio
                          </span>
                        )}
                        {message.usage &&
                          message.usage.totalTokens !== undefined &&
                          message.usage.totalTokens > 0 && (
                            <span
                              className="py-[3px] px-[7px] border border-line rounded text-[11px] text-muted"
                              title={`Prompt: ${message.usage.promptTokens ?? 0}, Completion: ${message.usage.completionTokens ?? 0}`}
                            >
                              {message.usage.totalTokens} tokens · est. $
                              {message.usage.estimatedCostUsd !== undefined
                                ? message.usage.estimatedCostUsd.toFixed(5)
                                : '0.00'}
                            </span>
                          )}
                      </>
                    )}
                  </div>
                  <FormattedContent content={message.content} />
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-3.5 mt-2.5">
                      <button
                        className="flex items-center gap-1.5 border-0 bg-transparent p-0 text-muted text-xs transition-colors duration-150 hover:text-accent cursor-pointer"
                        onClick={() => onReadAloud(message.content)}
                      >
                        <MdVolumeUp size={15} /> Read aloud
                      </button>
                      {message.sources?.length ? (
                        <span className="flex items-center gap-1.5 text-muted text-xs">
                          <MdMenuBook size={15} /> {message.sources.length} sources
                        </span>
                      ) : null}
                    </div>
                  )}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3.5 border border-line rounded-[9px] overflow-hidden bg-panel-raised">
                      <div className="h-[34px] flex items-center justify-between px-3 border-b border-line font-mono font-semibold text-[11px] tracking-[0.7px] text-muted">
                        <span>REFERENCES</span>
                        <span className="tracking-normal normal-case">{message.sources.length} passages</span>
                      </div>
                      {message.sources.map((source, index) => (
                        <div
                          className="flex gap-2.5 py-[11px] px-3 border-b border-line last:border-b-0"
                          key={`${source.documentId}-${source.page}-${index}`}
                        >
                          <div className="h-[22px] w-[22px] flex-[0_0_22px] grid place-items-center border border-line-strong rounded-[5px] font-mono font-semibold text-[11px] text-accent">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1 grid grid-cols-[minmax(0,1fr)_auto] gap-x-2.5 gap-y-1">
                            <strong className="text-[13px] font-semibold overflow-hidden text-ellipsis whitespace-nowrap max-[760px]:whitespace-normal">
                              {source.documentName}
                            </strong>
                            <span className="text-xs text-muted">Page {source.page}</span>
                            <p className="col-span-full text-[13px] leading-[1.6] text-muted mt-[3px] mb-0">
                              &ldquo;{source.excerpt}
                              {source.excerpt.length >= 260 ? '…' : ''}&rdquo;
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {asking && (
              <div className="flex items-start gap-[13px] max-[760px]:gap-2.5">
                <div className="h-[34px] w-[34px] flex-[0_0_34px] rounded-[10px] grid place-items-center text-[13px] font-bold max-[760px]:h-[30px] max-[760px]:w-[30px] max-[760px]:flex-[0_0_30px] bg-accent text-accent-ink">
                  <MdGraphicEq size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="min-h-[26px] flex flex-wrap items-center gap-x-2.5 gap-y-2 mb-1.5">
                    <strong className="text-[13px] font-bold">Voxora</strong>
                    <span className="text-xs text-muted-2">Thinking</span>
                  </div>
                  <div className="flex gap-[5px] py-3 px-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-[pulse_1.1s_infinite_ease-in-out]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-[pulse_1.1s_infinite_ease-in-out] [animation-delay:0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-[pulse_1.1s_infinite_ease-in-out] [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
