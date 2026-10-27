import pdf from 'pdf-parse';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import type { DocumentFormat } from './types';

type PdfTextItem = {
  str: string;
  transform: number[];
  width?: number;
  height?: number;
};

type PdfPageData = {
  getTextContent(options: {
    normalizeWhitespace: boolean;
    disableCombineTextItems: boolean;
  }): Promise<{ items: PdfTextItem[] }>;
};

type TextItemOnLine = {
  x: number;
  y: number;
  str: string;
  width: number;
};

type LineCluster = {
  y: number;
  items: TextItemOnLine[];
};

function cleanLineText(line: string): string {
  return line
    .replace(/\u0000/g, '')
    .replace(/^(?:\[\]|\[\s*\]|[\uF000-\uF8FF\u25A0-\u25CF\u2022\u25AA\u25BA\u2043\u2219])\s*/, '• ')
    .replace(/([a-zA-Z0-9])\s*-\s*([a-zA-Z0-9])/g, '$1-$2')
    .replace(/\s+([,.:;?!])/g, '$1')
    .trim();
}

function processPageItems(items: PdfTextItem[]): string {
  if (!items || items.length === 0) return '';

  const validItems: TextItemOnLine[] = [];
  for (const item of items) {
    if (!item.str || !item.transform) continue;
    validItems.push({
      x: item.transform[4],
      y: item.transform[5],
      str: item.str,
      width: item.width ?? 0,
    });
  }

  if (validItems.length === 0) return '';

  const lines: LineCluster[] = [];
  const lineTolerance = 3.5;

  for (const item of validItems) {
    let matchedLine = lines.find((l) => Math.abs(l.y - item.y) <= lineTolerance);
    if (!matchedLine) {
      matchedLine = { y: item.y, items: [] };
      lines.push(matchedLine);
    }
    matchedLine.items.push(item);
  }

  lines.sort((a, b) => b.y - a.y);

  const formattedLines: string[] = [];
  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);

    let lineStr = '';
    for (let i = 0; i < line.items.length; i++) {
      const cur = line.items[i];
      if (i === 0) {
        lineStr += cur.str;
      } else {
        const prev = line.items[i - 1];
        const gap = cur.x - (prev.x + prev.width);
        const needsSpace =
          gap > 1.5 &&
          !lineStr.endsWith(' ') &&
          !cur.str.startsWith(' ') &&
          !lineStr.endsWith('-') &&
          !cur.str.startsWith('-');
        lineStr += (needsSpace ? ' ' : '') + cur.str;
      }
    }

    const cleaned = cleanLineText(lineStr);
    if (cleaned) {
      formattedLines.push(cleaned);
    }
  }

  const paragraphs: string[] = [];
  let currentPara = '';

  for (let i = 0; i < formattedLines.length; i++) {
    const line = formattedLines[i];
    const isHeading =
      /^[A-Z0-9\s/&,.-]{4,45}$/.test(line) &&
      !line.endsWith('.') &&
      !line.startsWith('•');
    const isBullet =
      line.startsWith('•') ||
      /^[-*]\s+/.test(line) ||
      /^\d+[\.\)]\s+/.test(line);

    if (isHeading || isBullet) {
      if (currentPara.trim()) {
        paragraphs.push(currentPara.trim());
        currentPara = '';
      }
      paragraphs.push(line);
      continue;
    }

    if (!currentPara) {
      currentPara = line;
    } else if (currentPara.endsWith('-') && !currentPara.endsWith('--')) {
      currentPara = currentPara.slice(0, -1) + line;
    } else {
      const prevEndsSentence = /[.!?:]$/.test(currentPara);
      const nextStartsCap = /^[A-Z]/.test(line);
      const isShortLine = currentPara.length < 50;

      if (prevEndsSentence && (nextStartsCap || isShortLine)) {
        paragraphs.push(currentPara.trim());
        currentPara = line;
      } else {
        currentPara += ' ' + line;
      }
    }
  }

  if (currentPara.trim()) {
    paragraphs.push(currentPara.trim());
  }

  return paragraphs.join('\n\n');
}

function renderPdfPageWithMarker(pageData: PdfPageData) {
  return pageData
    .getTextContent({
      normalizeWhitespace: false,
      disableCombineTextItems: false,
    })
    .then((textContent) => {
      const pageText = processPageItems(textContent.items as PdfTextItem[]);
      return `\n---PAGE BREAK---\n${pageText}`;
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
      const rawText = parsed.text.replace(/\u0000/g, '').trim();
      const rawPages = rawText
        .split(/(?:^|\n)\s*---\s*PAGE\s*BREAK\s*---\s*(?:\n|$)/i)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      const text = rawPages.join('\n---PAGE BREAK---\n');
      const pages = Math.max(parsed.numpages || 1, rawPages.length, 1);
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
