import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { makeLocalAnswer, rankChunks } from '@/lib/retrieval';
import type { SourceChunk } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Official GroqCloud API Pricing (source: https://groq.com/pricing)
// Rates are strictly measured per 1,000,000 tokens (USD)
const GROQ_MODEL_PRICING: Record<
  string,
  { inputPerMillion: number; outputPerMillion: number }
> = {
  // Meta Llama 3.3 70B Versatile: $0.59 input / $0.79 output per 1M tokens
  'llama-3.3-70b-versatile': {
    inputPerMillion: 0.59,
    outputPerMillion: 0.79,
  },
  'llama-3.3-70b-specdec': {
    inputPerMillion: 0.59,
    outputPerMillion: 0.79,
  },
  // Meta Llama 3.1 70B: $0.59 input / $0.79 output per 1M tokens
  'llama-3.1-70b-versatile': {
    inputPerMillion: 0.59,
    outputPerMillion: 0.79,
  },
  // Meta Llama 3.1 8B Instant: $0.05 input / $0.08 output per 1M tokens
  'llama-3.1-8b-instant': {
    inputPerMillion: 0.05,
    outputPerMillion: 0.08,
  },
  // Mixtral 8x7B: $0.24 input / $0.24 output per 1M tokens
  'mixtral-8x7b-32768': {
    inputPerMillion: 0.24,
    outputPerMillion: 0.24,
  },
  // Gemma 2 9B: $0.20 input / $0.20 output per 1M tokens
  'gemma2-9b-it': {
    inputPerMillion: 0.2,
    outputPerMillion: 0.2,
  },
};

function getModelPricing(modelName: string) {
  return (
    GROQ_MODEL_PRICING[modelName.toLowerCase()] ??
    GROQ_MODEL_PRICING['llama-3.3-70b-versatile']
  );
}

type HistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const question =
      typeof body.question === 'string' ? body.question.trim() : '';
    const chunks = Array.isArray(body.chunks)
      ? (body.chunks as SourceChunk[])
      : [];
    const history: HistoryMessage[] = Array.isArray(body.history)
      ? body.history
          .filter(
            (item: Record<string, unknown>) =>
              Boolean(item) &&
              (item.role === 'user' || item.role === 'assistant') &&
              typeof item.content === 'string',
          )
          .slice(-6)
      : [];

    if (!question)
      return NextResponse.json(
        { error: 'Enter a question first.' },
        { status: 400 },
      );
    if (!chunks.length)
      return NextResponse.json(
        { error: 'Upload at least one document before asking a question.' },
        { status: 400 },
      );
    if (question.length > 1200)
      return NextResponse.json(
        { error: 'Keep questions under 1,200 characters.' },
        { status: 400 },
      );
    if (
      chunks.length > 300 ||
      chunks.some(
        (chunk) => typeof chunk.text !== 'string' || chunk.text.length > 3000,
      )
    )
      return NextResponse.json(
        {
          error:
            'The document set is too large for this demo. Remove a document and try again.',
        },
        { status: 413 },
      );

    // If this is a follow-up question (e.g., "And what about the other model?"),
    // incorporate previous context into lexical passage retrieval
    const lastUserTurn = history
      .filter((h) => h.role === 'user')
      .slice(-1)[0]?.content;
    const retrievalQuery =
      lastUserTurn && question.length < 50
        ? `${lastUserTurn} ${question}`
        : question;

    const matches = rankChunks(retrievalQuery, chunks, 6);
    const sources = matches.slice(0, 4).map((match) => ({
      documentId: match.documentId,
      documentName: match.documentName,
      page: match.page,
      excerpt: match.text.slice(0, 260),
      relevance: Math.round(match.score * 100) / 100,
    }));

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        answer: makeLocalAnswer(question, matches),
        sources,
        mode: 'local',
        latencyMs,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCostUsd: 0,
        },
      });
    }

    if (!matches.length) {
      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        answer:
          "The uploaded documents do not contain information to answer that question.",
        sources: [],
        mode: 'ai',
        latencyMs,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCostUsd: 0,
        },
      });
    }

    const context = matches
      .map(
        (match, index) =>
          `[SOURCE ${index + 1}: ${match.documentName}, page ${match.page}]\n${match.text}`,
      )
      .join('\n\n');

    // Build message thread with conversational history for follow-ups
    const formattedHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const client = new Groq({ apiKey });
    const completion = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 700,
      messages: [
        {
          role: 'system',
          content:
            'You are Voxora, an accurate equipment manual voice-and-document assistant. Answer strictly and only from the supplied source passages. If the passages do not contain the answer, explicitly state that the documents do not provide this information. Never invent facts, make assumptions, or draw on outside knowledge. Keep spoken answers concise, direct, and conversational (suitable for speech synthesis). Always provide exact page citations when referencing facts. If multiple models or document versions differ, clearly highlight the difference and name each document version and page. Understand follow-up questions within the context of recent turns.',
        },
        ...formattedHistory,
        {
          role: 'user',
          content: `Question: ${question}\n\nRetrieved source passages:\n${context}`,
        },
      ],
    });

    const answer = completion.choices[0]?.message?.content?.trim();
    if (!answer)
      return NextResponse.json(
        { error: 'The AI service returned an empty answer. Please try again.' },
        { status: 502 },
      );

    const selectedModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const pricing = getModelPricing(selectedModel);

    const promptTokens = completion.usage?.prompt_tokens ?? 0;
    const completionTokens = completion.usage?.completion_tokens ?? 0;
    const totalTokens = completion.usage?.total_tokens ?? 0;

    // Exact cost calculation based on official Groq rates per 1M tokens
    const inputCost = (promptTokens * pricing.inputPerMillion) / 1_000_000;
    const outputCost = (completionTokens * pricing.outputPerMillion) / 1_000_000;
    const estimatedCostUsd = Number((inputCost + outputCost).toFixed(6));
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      answer,
      sources,
      mode: 'ai',
      latencyMs,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUsd,
      },
    });
  } catch (error) {
    console.error('Question answering failed', error);
    const status = (error as { status?: number })?.status;
    if (status === 401)
      return NextResponse.json(
        {
          error:
            'The Groq API key was rejected. Check GROQ_API_KEY in your .env.local file.',
        },
        { status: 502 },
      );
    if (status === 429)
      return NextResponse.json(
        {
          error:
            'The AI service rate limit was reached. Wait a moment and try again.',
        },
        { status: 429 },
      );
    return NextResponse.json(
      { error: 'Something went wrong while answering. Please try again.' },
      { status: 500 },
    );
  }
}
