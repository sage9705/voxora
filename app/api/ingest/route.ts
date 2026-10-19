import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { splitIntoChunks } from '@/lib/retrieval';
import { detectDocumentFormat, parseDocumentFile } from '@/lib/documentParser';
import type { DocumentRecord } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const formData = await request.formData();

    // Accept both 'file' and 'files' form data fields for maximum compatibility
    const files = [
      ...formData.getAll('file'),
      ...formData.getAll('files'),
    ].filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        {
          error:
            'Please upload at least one document (PDF, Word, TXT, Markdown, CSV, or Excel).',
        },
        { status: 400 },
      );
    }

    const documents: DocumentRecord[] = [];

    for (const file of files) {
      const docStartTime = Date.now();
      const format = detectDocumentFormat(file.name, file.type);

      if (!format) {
        return NextResponse.json(
          {
            error: `"${file.name}" has an unsupported format. Supported formats: PDF (.pdf), Word (.docx), Plain text (.txt), Markdown (.md), and Sheets (.csv, .xlsx, .xls).`,
          },
          { status: 400 },
        );
      }

      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: `${file.name} exceeds the 50 MB upload limit.` },
          { status: 413 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const { text, pages } = await parseDocumentFile(
        buffer,
        file.name,
        file.type,
      );

      if (text.length < 10) {
        return NextResponse.json(
          {
            error: `No readable text was found in ${file.name}. The file may be empty or contain non-text media.`,
          },
          { status: 422 },
        );
      }

      const docId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      const chunks = splitIntoChunks(text, docId, file.name);

      let suggestedQuestions:
        Array<{ label: string; question: string }> | undefined;
      const rawApiKey = process.env.GROQ_API_KEY?.trim().replace(
        /^["']|["']$/g,
        '',
      );
      const selectedModel =
        process.env.GROQ_MODEL?.trim().replace(/^["']|["']$/g, '') ||
        'qwen/qwen3.8-27b';

      if (rawApiKey) {
        try {
          const groq = new Groq({ apiKey: rawApiKey });
          const completion = await groq.chat.completions.create({
            model: selectedModel,
            temperature: 0.2,
            max_tokens: 350,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert document assistant. Given the title and excerpt of an uploaded document, generate 3 to 4 concise, highly relevant questions that a user would naturally ask about this specific document (e.g. for a CV/resume, ask about the candidate\'s background, technical skills, or roles; for a financial or business doc or spreadsheet, ask about key metrics or summary; for a manual or guide, ask about setup or operation). Return strictly a JSON object with a "questions" key containing an array of objects with "label" (2-3 words) and "question" (the question text).',
              },
              {
                role: 'user',
                content: `Document Name: ${file.name}\n\nExcerpt:\n${text.slice(0, 3500)}`,
              },
            ],
          });

          const content = completion.choices[0]?.message?.content?.trim();
          if (content) {
            const parsedJson = JSON.parse(content);
            if (Array.isArray(parsedJson.questions)) {
              suggestedQuestions = parsedJson.questions
                .filter(
                  (q: unknown): q is { label: string; question: string } =>
                    Boolean(q) &&
                    typeof (q as { label?: unknown }).label === 'string' &&
                    typeof (q as { question?: unknown }).question === 'string',
                )
                .slice(0, 4);
            }
          }
        } catch (aiErr) {
          console.warn('AI starter generation skipped:', aiErr);
        }
      }

      const ingestTimeMs = Date.now() - docStartTime;

      documents.push({
        id: docId,
        name: file.name,
        size: file.size,
        pages,
        text,
        format,
        chunks,
        suggestedQuestions,
        addedAt: Date.now(),
        ingestTimeMs,
      });
    }

    const totalIngestTimeMs = Date.now() - startTime;

    return NextResponse.json({
      document: documents[0],
      documents,
      totalIngestTimeMs,
    });
  } catch (error) {
    console.error('Document ingestion failed:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to process uploaded files.';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
