import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';
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
          text += (text.length > 0 && !text.endsWith('\n') ? '\n' : '') + item.str;
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

      if (file.size > 8 * 1024 * 1024) {
        return NextResponse.json(
          { error: `${file.name} exceeds the 8 MB upload limit.` },
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
      const ingestTimeMs = Date.now() - docStartTime;

      documents.push({
        id: docId,
        name: file.name,
        size: file.size,
        pages: parsed.numpages || 1,
        text,
        chunks,
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

