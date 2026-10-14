'use client';

import { useEffect, useRef } from 'react';
import {
  ArrowUpRight,
  AudioLines,
  BookOpen,
  History,
  Trash2,
  User,
  Volume2,
} from 'lucide-react';
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
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('[Page') && token.endsWith(']')) {
      parts.push(
        <span className="inline-page-badge" key={match.index}>
          {token.slice(1, -1)}
        </span>,
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code className="inline-code" key={match.index}>
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
          <ol key={`ol-${elements.length}`} className="formatted-steps">
            {currentList.items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ol>,
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="formatted-bullets">
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
        <blockquote key={`q-${i}`} className="formatted-quote">
          {parseInline(quoteText)}
        </blockquote>,
      );
      continue;
    }

    // Headers e.g. "### Heading"
    if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
      const headingText = trimmed.replace(/^#+\s*/, '');
      elements.push(
        <h4 key={`h-${i}`} className="formatted-heading">
          {parseInline(headingText)}
        </h4>,
      );
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={`p-${i}`} className="formatted-p">
        {parseInline(trimmed)}
      </p>,
    );
  }

  flushList();

  return <div className="formatted-content">{elements}</div>;
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
    <div className="chat-layout">
      <div className="chat-toolbar">
        <div className="chat-context">
          <div className="context-icon">
            <BookOpen size={17} />
          </div>
          <div>
            <strong>Document conversation</strong>
            <span>
              {documentsCount} {documentsCount === 1 ? 'document' : 'documents'}{' '}
              in context <span className="context-dot" /> Ready to ask
            </span>
          </div>
        </div>
        <div className="chat-toolbar-actions">
          <button
            className={`quiet-button ${autoSpeak ? 'active' : ''}`}
            onClick={onToggleAutoSpeak}
            title={autoSpeak ? 'Spoken answers enabled' : 'Spoken answers muted'}
          >
            <Volume2 size={15} />{' '}
            {autoSpeak ? 'Voice answers: On' : 'Voice answers: Off'}
          </button>
          <button className="quiet-button" onClick={onToggleHistory}>
            <History size={15} /> History
          </button>
          <button
            className="icon-button"
            onClick={onClearConversation}
            title="Clear conversation"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="conversation-area">
        {!messages.length ? (
          <div className="conversation-empty">
            <div className="conversation-orb">
              <AudioLines size={27} />
            </div>
            <h2>Let&apos;s find something.</h2>
            <p>
              Ask a question about your documents or start with one of these.
            </p>
            <div className="starter-list">
              {starters.map((item) => (
                <button
                  key={item.label}
                  className="starter-button"
                  onClick={() => onSelectStarter(item.question)}
                >
                  <span>{item.label}</span>
                  <strong>{item.question}</strong>
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((message) => (
              <div className={`message-row ${message.role}`} key={message.id}>
                <div className={`message-avatar ${message.role}`}>
                  {message.role === 'assistant' ? (
                    <AudioLines size={17} />
                  ) : (
                    <User size={16} />
                  )}
                </div>
                <div className="message-body">
                  <div className="message-meta">
                    <strong>
                      {message.role === 'assistant' ? 'Voxora' : 'You'}
                    </strong>
                    <span>
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {message.role === 'assistant' && (
                      <>
                        {message.mode === 'local' ? (
                          <span className="mode-pill">Local retrieval</span>
                        ) : (
                          <span className="mode-pill">AI grounded</span>
                        )}
                        {message.latencyMs !== undefined && (
                          <span
                            className="mode-pill"
                            title="Processing latency"
                          >
                            ⚡ {message.latencyMs}ms
                          </span>
                        )}
                        {message.audioLatencyMs !== undefined && (
                          <span
                            className="mode-pill"
                            title="Question to first audible answer"
                          >
                            🔊 {message.audioLatencyMs}ms to audio
                          </span>
                        )}
                        {message.usage &&
                          message.usage.totalTokens !== undefined &&
                          message.usage.totalTokens > 0 && (
                            <span
                              className="mode-pill"
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
                  <div className="message-text">
                    <FormattedContent content={message.content} />
                  </div>
                  {message.role === 'assistant' && (
                    <div className="message-actions">
                      <button onClick={() => onReadAloud(message.content)}>
                        <Volume2 size={14} /> Read aloud
                      </button>
                      {message.sources?.length ? (
                        <span>
                          <BookOpen size={14} /> {message.sources.length} sources
                        </span>
                      ) : null}
                    </div>
                  )}
                  {message.sources && message.sources.length > 0 && (
                    <div className="sources-panel">
                      <div className="sources-heading">
                        <span>REFERENCES</span>
                        <span>{message.sources.length} passages</span>
                      </div>
                      {message.sources.map((source, index) => (
                        <div
                          className="source-row"
                          key={`${source.documentId}-${source.page}-${index}`}
                        >
                          <div className="source-number">{index + 1}</div>
                          <div className="source-content">
                            <strong>{source.documentName}</strong>
                            <span>Page {source.page}</span>
                            <p>
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
              <div className="message-row assistant">
                <div className="message-avatar assistant">
                  <AudioLines size={17} />
                </div>
                <div className="message-body">
                  <div className="message-meta">
                    <strong>Voxora</strong>
                    <span>Thinking</span>
                  </div>
                  <div className="thinking">
                    <span />
                    <span />
                    <span />
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
