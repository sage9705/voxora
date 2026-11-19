export type SourceChunk = {
  id: string;
  documentId: string;
  documentName: string;
  page: number;
  text: string;
  embedding?: number[];
};

export type DocumentFormat = 'pdf' | 'docx' | 'txt' | 'md' | 'csv' | 'xlsx';

export type DocumentRecord = {
  id: string;
  name: string;
  size: number;
  pages: number;
  text: string;
  chunks: SourceChunk[];
  format?: DocumentFormat;
  suggestedQuestions?: Array<{ label: string; question: string }>;
  addedAt: number;
  ingestTimeMs?: number;
};

export type AnswerSource = {
  documentId: string;
  documentName: string;
  page: number;
  excerpt: string;
  relevance: number;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: AnswerSource[];
  createdAt: number;
  mode?: 'ai' | 'local';
  latencyMs?: number;
  audioLatencyMs?: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    estimatedCostUsd?: number;
  };
};
