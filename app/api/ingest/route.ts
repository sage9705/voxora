import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import Groq from 'groq-sdk';
import { splitIntoChunks } from '@/lib/retrieval';
import type { DocumentRecord } from '@/lib/types';

export const runtime = 'nodejs';

type PdfTextItem = {
  str: string;
  transform: number[];
};

type PdfPageData = {
  getTextContent(options: {
    normalizeWhitespace: boolean;
    disableCombineTextItems: boolean;
  }): Promise<{ items: PdfTextItem[] }>;
};

// Custom page renderer that injects a standard page break delimiter
// so that page numbers and passage citations remain accurate
function renderPageWithMarker(pageData: PdfPageData) {
  return pageData
    .getTextContent({
      normalizeWhitespace: false,
      disableCombineTextItems: false,
    })
    .then((textContent) => {
      let lastY: number | undefined;
      let text = '';
      for (const item of textContent.items) {
        if (!item.str) continue;
        if (lastY === undefined || lastY === item.transform[5]) {
          const needsSpace =
            text.length > 0 &&
            !text.endsWith(' ') &&
            !text.endsWith('\n') &&
            !item.str.startsWith(' ');
          text += (needsSpace ? ' ' : '') + item.str;
        } else {
          text +=
            (text.length > 0 && !text.endsWith('\n') ? '\n' : '') + item.str;
        }
        lastY = item.transform[5];
      }
      return `\n---PAGE BREAK---\n${text}`;
    });
}

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
        { error: 'Please upload at least one PDF file.' },
        { status: 400 },
      );
    }

    const documents: DocumentRecord[] = [];

    for (const file of files) {
      const docStartTime = Date.now();
      const isPdf =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf');

      if (!isPdf) {
        return NextResponse.json(
          { error: `${file.name} is not a PDF file.` },
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
      const parsed = await pdf(buffer, { pagerender: renderPageWithMarker });
      const text = parsed.text.replace(/\u0000/g, '').trim();

      if (text.length < 30) {
        return NextResponse.json(
          {
            error: `No readable text was found in ${file.name}. The PDF may be scanned; OCR is not included.`,
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
                  'You are an expert document assistant. Given the title and excerpt of an uploaded document, generate 3 to 4 concise, highly relevant questions that a user would naturally ask about this specific document (e.g. for a CV/resume, ask about the candidate\'s background, technical skills, or roles; for a financial or business doc, ask about metrics or summary; for a manual, ask about setup or operation). Return strictly a JSON object with a "questions" key containing an array of objects with "label" (2-3 words) and "question" (the question text).',
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
        pages: parsed.numpages || 1,
        text,
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
    console.error('PDF ingestion failed:', error);

    return NextResponse.json(
      { error: 'Failed to process the uploaded PDF files.' },
      { status: 500 },
    );
  }
}
