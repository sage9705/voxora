import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const documents = Array.isArray(body.documents) ? body.documents : [];

    if (!documents.length) {
      return NextResponse.json({ questions: [] });
    }

    const rawApiKey = process.env.GROQ_API_KEY?.trim().replace(
      /^["']|["']$/g,
      '',
    );
    const selectedModel =
      process.env.GROQ_MODEL?.trim().replace(/^["']|["']$/g, '') ||
      'qwen/qwen3.8-27b';

    if (!rawApiKey) {
      return NextResponse.json({ questions: [] });
    }

    const groq = new Groq({ apiKey: rawApiKey });

    // Prepare document context: excerpts of up to 2 documents
    const docContext = documents
      .slice(0, 2)
      .map(
        (doc: { name?: string; text?: string }) =>
          `Document Name: ${doc.name || 'Document'}\nExcerpt:\n${(doc.text || '').slice(0, 3000)}`,
      )
      .join('\n\n---\n\n');

    const completion = await groq.chat.completions.create({
      model: selectedModel,
      temperature: 0.2,
      max_tokens: 350,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an expert document assistant. Given the title and excerpt of an uploaded document (or documents), generate 3 to 4 concise, natural, and highly relevant questions that a user would ask about this specific document (e.g. if a CV/resume, ask about the candidate\'s experience, skills, or education; if a financial report, ask about revenue, margins, or forecasts; if a contract, ask about terms, obligations, or termination; if a manual, ask about setup or operations). Return strictly a JSON object with a "questions" key containing an array of objects with "label" (2-3 words) and "question" (the full question text).',
        },
        {
          role: 'user',
          content: `Here are the uploaded document details:\n\n${docContext}\n\nGenerate 3-4 specific starter questions in JSON format:`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ questions: [] });
    }

    const parsed = JSON.parse(content);
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions
          .filter(
            (q: unknown): q is { label: string; question: string } =>
              Boolean(q) &&
              typeof (q as { label?: unknown }).label === 'string' &&
              typeof (q as { question?: unknown }).question === 'string',
          )
          .slice(0, 6)
      : [];

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Failed to generate starter questions with AI:', error);
    return NextResponse.json({ questions: [] });
  }
}
