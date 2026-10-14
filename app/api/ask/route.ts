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

    const rawApiKey = process.env.GROQ_API_KEY?.trim().replace(/^["']|["']$/g, '');
    const selectedModel =
      process.env.GROQ_MODEL?.trim().replace(/^["']|["']$/g, '') ||
      'llama-3.3-70b-versatile';

    if (!rawApiKey) {
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
          'The uploaded documents do not contain information to answer that question.',
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

    let answer = '';
    let mode: 'ai' | 'local' = 'ai';
    let warning: string | undefined;
    const usage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
    };

    const candidateModels = Array.from(
      new Set([
        selectedModel,
        'llama-3.1-8b-instant',
        'llama-3.3-70b-versatile',
        'llama-3.1-70b-versatile',
        'mixtral-8x7b-32768',
      ]),
    );

    const client = new Groq({ apiKey: rawApiKey });
    let lastError: unknown = null;
    let successfulModel = selectedModel;

    for (const modelToTry of candidateModels) {
      try {
        const completion = await client.chat.completions.create({
          model: modelToTry,
          temperature: 0.1,
          max_tokens: 750,
          messages: [
            {
              role: 'system',
              content:
                'You are Voxora, an accurate voice-first document intelligence and RAG assistant. Answer strictly and only from the supplied source passages. If the passages do not contain the answer, explicitly state that the documents do not provide this information. Never invent facts, make assumptions, or draw on outside knowledge.\n\nFormatting Guidelines:\n- Format your answer with clean, readable markdown.\n- When describing steps or procedures, format them as clean numbered lists (e.g. 1. Step one, 2. Step two).\n- Use bold text for key terms, warnings, and specifications.\n- Keep paragraphs separated by blank lines.\n- Always include exact page citations when referencing facts (e.g. [Page 3]).\n- Keep spoken phrasing natural and conversational for voice synthesis.',
            },
            ...formattedHistory,
            {
              role: 'user',
              content: `Question: ${question}\n\nRetrieved source passages:\n${context}`,
            },
          ],
        });

        const candidateAnswer =
          completion.choices[0]?.message?.content?.trim() || '';
        if (candidateAnswer) {
          answer = candidateAnswer;
          successfulModel = modelToTry;
          const pricing = getModelPricing(successfulModel);
          usage.promptTokens = completion.usage?.prompt_tokens ?? 0;
          usage.completionTokens = completion.usage?.completion_tokens ?? 0;
          usage.totalTokens = completion.usage?.total_tokens ?? 0;

          const inputCost =
            (usage.promptTokens * pricing.inputPerMillion) / 1_000_000;
          const outputCost =
            (usage.completionTokens * pricing.outputPerMillion) / 1_000_000;
          usage.estimatedCostUsd = Number((inputCost + outputCost).toFixed(6));
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Groq model ${modelToTry} was unavailable, trying next candidate:`, err);
      }
    }

    if (!answer) {
      console.error(
        'All Groq AI models failed or unavailable, falling back to local passage retrieval:',
        lastError,
      );
      const errMsg =
        lastError instanceof Error ? lastError.message : String(lastError);
      answer = makeLocalAnswer(question, matches);
      mode = 'local';
      warning = `AI generation was unavailable (${errMsg}). Answer served via local passage retrieval.`;
    }

    const latencyMs = Date.now() - startTime;
    return NextResponse.json({
      answer,
      sources,
      mode,
      latencyMs,
      usage,
      warning,
    });
  } catch (error) {
    console.error('Question answering pipeline failed', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Something went wrong while answering. Please try again.',
      },
      { status: 500 },
    );
  }
}
