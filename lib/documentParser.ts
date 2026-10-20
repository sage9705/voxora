import pdf from 'pdf-parse';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import type { DocumentFormat } from './types';

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
function renderPdfPageWithMarker(pageData: PdfPageData) {
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

export function detectDocumentFormat(
  filename: string,
  mimeType: string,
): DocumentFormat | null {
  const ext = filename.toLowerCase().split('.').pop() || '';
  if (ext === 'pdf' || mimeType === 'application/pdf') return 'pdf';
  if (
    ext === 'docx' ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return 'docx';
  if (ext === 'txt' || mimeType === 'text/plain') return 'txt';
  if (
    ext === 'md' ||
    ext === 'markdown' ||
    mimeType === 'text/markdown' ||
    mimeType === 'text/x-markdown'
  )
    return 'md';
  if (ext === 'csv' || mimeType === 'text/csv') return 'csv';
  if (
    ext === 'xlsx' ||
    ext === 'xls' ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  )
    return 'xlsx';
  return null;
}

// Splits large text into pages of ~2,500 characters, breaking at line breaks or sentences
function paginatePlainText(text: string, charsPerPage = 2500): string {
  if (text.length <= charsPerPage) {
    return text;
  }

  const paragraphs = text.split(/\n\s*\n/);
  const pages: string[] = [];
  let currentPage = '';

  for (const paragraph of paragraphs) {
    if (currentPage.length + paragraph.length > charsPerPage && currentPage.trim()) {
      pages.push(currentPage.trim());
      currentPage = paragraph;
    } else {
      currentPage += (currentPage ? '\n\n' : '') + paragraph;
    }
  }

  if (currentPage.trim()) {
    pages.push(currentPage.trim());
  }

  return pages.join('\n---PAGE BREAK---\n');
}

export async function parseDocumentFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<{ text: string; pages: number; format: DocumentFormat }> {
  const format = detectDocumentFormat(filename, mimeType);
  if (!format) {
    throw new Error(
      `Unsupported file type for "${filename}". Supported formats: PDF (.pdf), Word (.docx), Plain text (.txt), Markdown (.md), and CSV / Excel (.csv, .xlsx, .xls).`,
    );
  }

  switch (format) {
    case 'pdf': {
      const parsed = await pdf(buffer, {
        pagerender: renderPdfPageWithMarker,
      });
      const text = parsed.text.replace(/\u0000/g, '').trim();
      const pages = Math.max(
        parsed.numpages || 1,
        text.split(/\n\s*---\s*PAGE\s*BREAK\s*---\s*\n|\f/i).filter(Boolean).length || 1,
      );
      return { text, pages, format };
    }

    case 'docx': {
      const result = await mammoth.extractRawText({ buffer });
      const rawText = result.value.replace(/\u0000/g, '').trim();
      const text = paginatePlainText(rawText);
      const pages = Math.max(
        1,
        text.split(/\n\s*---\s*PAGE\s*BREAK\s*---\s*\n/).filter(Boolean).length,
      );
      return { text, pages, format };
    }

    case 'txt':
    case 'md': {
      const rawText = buffer.toString('utf-8').replace(/\u0000/g, '').trim();
      // If Markdown has horizontal rules on their own line, treat as page break
      let paginated: string;
      if (format === 'md' && /\n\s*(?:---+|\*\*\*+)\s*\n/.test(rawText)) {
        paginated = rawText.replace(
          /\n\s*(?:---+|\*\*\*+)\s*\n/g,
          '\n---PAGE BREAK---\n',
        );
      } else {
        paginated = paginatePlainText(rawText);
      }
      const pages = Math.max(
        1,
        paginated.split(/\n\s*---\s*PAGE\s*BREAK\s*---\s*\n/).filter(Boolean)
          .length,
      );
      return { text: paginated, pages, format };
    }

    case 'csv':
    case 'xlsx': {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetPages: string[] = [];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) continue;

        // Convert worksheet to CSV lines
        const csvContent = XLSX.utils.sheet_to_csv(worksheet, {
          blankrows: false,
        });
        const rows = csvContent.split('\n').filter((r) => r.trim());

        if (rows.length === 0) continue;

        // If sheet is large (>80 rows), paginate chunks of 60 rows with header preserved
        const headerRow = rows[0];
        const rowsPerPage = 60;

        if (rows.length > rowsPerPage) {
          for (let i = 0; i < rows.length; i += rowsPerPage) {
            const chunkRows = rows.slice(i, i + rowsPerPage);
            // Re-inject header if not first chunk
            const pageHeader =
              i === 0
                ? `[Sheet: ${sheetName} (Rows 1–${Math.min(rows.length, i + rowsPerPage)})]\n`
                : `[Sheet: ${sheetName} (Rows ${i + 1}–${Math.min(rows.length, i + rowsPerPage)}) - Header: ${headerRow}]\n`;

            sheetPages.push(pageHeader + chunkRows.join('\n'));
          }
        } else {
          sheetPages.push(`[Sheet: ${sheetName}]\n${rows.join('\n')}`);
        }
      }

      if (sheetPages.length === 0) {
        sheetPages.push('[Empty sheet with no data]');
      }

      const text = sheetPages.join('\n---PAGE BREAK---\n');
      const pages = sheetPages.length;
      return { text, pages, format };
    }
  }
}
